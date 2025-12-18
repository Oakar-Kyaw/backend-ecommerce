import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
      this.eventPublisher.sendOrderNotification({
        orderId: String(savedOrder._id),
        userId: savedOrder.userId,
        totalAmount: savedOrder.totalAmount,
        status: savedOrder.status,
        email: userData?.email || null,
      });

      // Notify brands
      const brandIds = [...new Set(items.map(item => item.brandId))];
      for (const brandId of brandIds) {
        const brandItems = items.filter(item => item.brandId === brandId);
        this.notificationClient.emit('notify_brand_order', {
          brandId,
          orderId: savedOrder._id,
          items: brandItems,
          status: savedOrder.status,
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
    );
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
        email: userData?.email || null
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
      console.log('Fetched user details for:', userId, 'Response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user details for:', userId, error.message);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      return null;
    }
  }
}
