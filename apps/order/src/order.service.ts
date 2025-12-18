import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { ShippingLocation, ShippingLocationDocument } from './schemas/shipping-location.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClientProxy } from '@nestjs/microservices';
import axios from 'axios';
import { envConfig } from 'libs/config/envConfig';
import { getPagination, buildPaginationResponse } from '../../../libs/utils/pagination';
import { EventPublisherService } from './event-publisher.service';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class OrderService {
  constructor(
    private readonly eventPublisher: EventPublisherService,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ShippingLocation.name) private shippingLocationModel: Model<ShippingLocationDocument>,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const { items, shippingFee = 0, tax = 0, shippingAddress, ...orderData } = createOrderDto;

    // Populate brandId for items if missing and fetch product names
    const enrichedItems = await Promise.all(items.map(async (item) => {
      let productName = 'Product';
      if (!item.brandId || true) { // Always fetch for name
        try {
          const response = await axios.get(`http://localhost:${envConfig().product_service_port}/api/v1/products/${item.productId}`);
          if (response.data?.data) {
             const product = response.data.data;
             productName = product.name || 'Product';
             if (!item.brandId) {
                item.brandId = product.brandId;
             }
          } else {
             if (!item.brandId) throw new NotFoundException(`Brand ID not found for product ${item.productId}`);
          }
        } catch (error) {
          console.error(`Failed to fetch product details for ${item.productId}:`, error.message);
          if (!item.brandId) throw new NotFoundException(`Product ${item.productId} not found or Brand ID missing`);
        }
      }
      return { ...item, name: productName };
    }));

    // Create and save shipping location
    const createdLocation = new this.shippingLocationModel(shippingAddress);
    const savedLocation = await createdLocation.save();

    // Calculate subtotal from items
    const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Calculate total amount
    const totalAmount = subTotal + shippingFee + tax;

    // Initialize brand statuses
    const brandIds = [...new Set(items.map(item => item.brandId))];
    const brandStatuses = brandIds.map(brandId => ({ brandId, status: 'PENDING' }));

    const createdOrder = new this.orderModel({
      ...orderData,
      items,
      shippingFee,
      tax,
      subTotal,
      totalAmount,
      shippingLocationId: savedLocation._id,
      brandStatuses,
    });
    const savedOrder = await createdOrder.save();
    
    // Emit notification
    try {
      const userData = await this.userModel.findOne({ userId: savedOrder.userId})
      
      await this.eventPublisher.sendOrderNotification({
        orderId: String(savedOrder._id),
        userId: savedOrder.userId,
        totalAmount: savedOrder.totalAmount,
        status: savedOrder.status,
        email: userData?.email || null,
        items: enrichedItems,
        shippingAddress: savedLocation
      });

      // Notify brands
      const brandItems = enrichedItems.reduce((acc, item) => {
        if (!acc[item.brandId]) {
          acc[item.brandId] = [];
        }
        acc[item.brandId].push(item);
        return acc;
      }, {});

      for (const [brandId, items] of Object.entries(brandItems)) {
        this.notificationClient.emit('notify_brand_order', {
          brandId,
          orderId: savedOrder._id,
          items,
          status: savedOrder.status,
          shippingAddress: savedLocation
        });
      }
    } catch (error) {
      console.error('Failed to emit notify_order event:', error);
    }

    return savedOrder;
  }

  async findOne(id: string): Promise<any> {
    const order = await this.orderModel.findById(id).populate('shippingLocationId').lean();
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return this.populateOrderDetails(order);
  }

  async findAll(page?: number, pageSize?: number): Promise<any> {
    const meta = getPagination({ page, pageSize });
    const orders = await this.orderModel.find().populate('shippingLocationId').lean().skip(meta.skip).limit(meta.limit).exec();
    const total = await this.orderModel.countDocuments().exec();

    const enrichedOrders = await Promise.all(orders.map((order) => this.populateOrderDetails(order)));

    return buildPaginationResponse(enrichedOrders, meta, total, 'LIST_OF_ORDERS');
  }

  async findByUser(userId: string): Promise<any[]> {
    const orders = await this.orderModel.find({ userId }).populate('shippingLocationId').lean().exec();
    
    return Promise.all(orders.map((order) => this.populateOrderDetails(order)));
  }

  async updateStatus(id: string, status: string): Promise<Order> {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).populate('shippingLocationId');
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    // Emit notification
    const userData = await this.userModel.findOne({ userId: order.userId})
    this.eventPublisher.sendOrderNotification({
        orderId: String(order._id),
        userId: order.userId,
        totalAmount: order.totalAmount,
        status: order.status,
        email: userData?.email || null,
        items: order.items,
        shippingAddress: order.shippingLocationId
    })

    return order;
  }

  async updateBrandStatus(id: string, brandId: number, status: string): Promise<Order> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    // Check if brand exists in order
    const brandStatusIndex = order.brandStatuses.findIndex(bs => bs.brandId === brandId);
    if (brandStatusIndex === -1) {
        // If for some reason it doesn't exist (old orders), add it
        order.brandStatuses.push({ brandId, status: status as any });
    } else {
        order.brandStatuses[brandStatusIndex].status = status as any;
    }

    // Check if all brands have the same status, if so update main status?
    // Or just leave main status as is until explicit update?
    // Let's implement logic: if all brands are DELIVERED, main order is DELIVERED.
    // If all are CANCELLED, main is CANCELLED.
    
    const allStatuses = order.brandStatuses.map(bs => bs.status);
    const uniqueStatuses = [...new Set(allStatuses)];
    
    if (uniqueStatuses.length === 1) {
        order.status = uniqueStatuses[0];
    } else if (allStatuses.every(s => s === 'DELIVERED')) {
         order.status = 'DELIVERED' as any;
    } else if (allStatuses.every(s => s === 'CANCELLED')) {
         order.status = 'CANCELLED' as any;
    }

    const savedOrder = await order.save();
    
    // Notify user about partial/brand update
    this.notificationClient.emit('notify_order', {
        orderId: savedOrder._id,
        userId: savedOrder.userId,
        totalAmount: savedOrder.totalAmount,
        status: `partially updated to ${status}`,
        // name: user name is fetched by notification service if needed
    });

    return savedOrder;
  }

  async getAdminAnalytics(year: number) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: { $gte: startOfYear, $lt: endOfYear }
        }
      },
      {
        $facet: {
          monthlyStats: [
            {
              $group: {
                _id: { $month: "$createdAt" },
                revenue: { $sum: "$totalAmount" },
                salesCount: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          bestSellingItems: [
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.productId",
                name: { $first: "$items.name" },
                totalQuantity: { $sum: "$items.quantity" }
              }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
          ],
          topBrands: [
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.brandId",
                totalSales: { $sum: "$items.quantity" }
              }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ];

    const [results] = await this.orderModel.aggregate(pipeline);
    
    // Format monthly stats
    const monthlyStats = Array(12).fill(0).map((_, i) => ({
        month: i + 1,
        revenue: 0,
        salesCount: 0
    }));
    
    results.monthlyStats.forEach((stat: any) => {
        const index = stat._id - 1;
        monthlyStats[index].revenue = stat.revenue;
        monthlyStats[index].salesCount = stat.salesCount;
    });

    const bestSellingItemsWithNames = await Promise.all(results.bestSellingItems.map(async (item: any) => {
        try {
            // productId is stored as string in Order, but Product Service expects ID
            // Assuming productId in Order matches Product ID (which is Int)
            const response = await axios.get(`http://localhost:${envConfig().product_service_port}/api/v1/products/${item._id}`);
            return {
                _id: item._id,
                name: response.data.data?.name || 'Unknown Product',
                totalQuantity: item.totalQuantity
            };
        } catch (e) {
            return {
                _id: item._id,
                name: 'Unknown Product',
                totalQuantity: item.totalQuantity
            };
        }
    }));

    const topBrandsWithNames = await Promise.all(results.topBrands.map(async (brand: any) => {
        try {
            const response = await axios.get(`http://localhost:${envConfig().user_service_port}/api/v1/brands/${brand._id}`);
            return {
                brandId: brand._id,
                name: response.data.data?.name || 'Unknown',
                totalSales: brand.totalSales
            };
        } catch (e) {
            return {
                brandId: brand._id,
                name: 'Unknown',
                totalSales: brand.totalSales
            };
        }
    }));

    return {
        year,
        monthlyStats,
        bestSellingItems: bestSellingItemsWithNames,
        topBrands: topBrandsWithNames
    };
  }

  async getBrandAnalytics(brandId: number, year: number) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    const bId = Number(brandId);

    const [results] = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lt: endOfYear },
          "items.brandId": bId
        }
      },
      {
        $facet: {
          monthlyRevenueAndItems: [
             { $unwind: "$items" },
             { $match: { "items.brandId": bId } },
             {
               $group: {
                 _id: { $month: "$createdAt" },
                 revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                 itemsSold: { $sum: "$items.quantity" }
               }
             },
             { $sort: { _id: 1 } }
          ],
          monthlyOrderCount: [
             {
               $group: {
                 _id: { $month: "$createdAt" },
                 orderCount: { $sum: 1 }
               }
             },
             { $sort: { _id: 1 } }
          ],
          bestSellingItems: [
            { $unwind: "$items" },
            { $match: { "items.brandId": bId } },
            {
              $group: {
                _id: "$items.productId",
                name: { $first: "$items.name" },
                totalQuantity: { $sum: "$items.quantity" }
              }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    // Merge monthly stats
    const monthlyStats = Array(12).fill(0).map((_, i) => ({
        month: i + 1,
        revenue: 0,
        saleCount: 0, 
        itemsSold: 0
    }));

    results.monthlyRevenueAndItems.forEach((stat: any) => {
        const index = stat._id - 1;
        monthlyStats[index].revenue = stat.revenue;
        monthlyStats[index].itemsSold = stat.itemsSold;
    });

    results.monthlyOrderCount.forEach((stat: any) => {
        const index = stat._id - 1;
        monthlyStats[index].saleCount = stat.orderCount;
    });

    const bestSellingItemsWithNames = await Promise.all(results.bestSellingItems.map(async (item: any) => {
        try {
            const response = await axios.get(`http://localhost:${envConfig().product_service_port}/api/v1/products/${item._id}`);
            return {
                _id: item._id,
                name: response.data.data?.name || 'Unknown Product',
                totalQuantity: item.totalQuantity
            };
        } catch (e) {
            return {
                _id: item._id,
                name: 'Unknown Product',
                totalQuantity: item.totalQuantity
            };
        }
    }));

    return {
        brandId: bId,
        year,
        monthlyStats,
        bestSellingItems: bestSellingItemsWithNames
    };
  }

  private async populateOrderDetails(order: any) {
    const [payment, userInfo] = await Promise.all([
      this.fetchPaymentDetails(order._id),
      this.fetchUserDetails(order.userId),
    ]);
    return { ...order, payment, userInfo };
  }

  private async fetchPaymentDetails(orderId: string) {
    try {
      const response = await axios.get(`http://localhost:${envConfig().payment_service_port}/api/v1/payments/order/${orderId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  private async fetchUserDetails(userId: string) {
    try {
      const response = await axios.get(`http://localhost:${envConfig().user_service_port}/api/v1/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user details for:', userId, error.message);
      return null;
    }
  }
}
