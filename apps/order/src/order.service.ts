import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { ShippingLocation, ShippingLocationDocument } from './schemas/shipping-location.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClientProxy } from '@nestjs/microservices';
import axios from 'axios';
import { envConfig } from 'libs/config/envConfig';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
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

    const createdOrder = new this.orderModel({
      ...orderData,
      items,
      shippingFee,
      tax,
      subTotal,
      totalAmount,
      shippingLocationId: savedLocation._id,
    });
    const savedOrder = await createdOrder.save();
    
    // Emit notification
    try {
      this.notificationClient.emit('notify_order', {
        orderId: savedOrder._id,
        userId: savedOrder.userId,
        totalAmount: savedOrder.totalAmount,
        status: savedOrder.status,
        // name: user name is fetched by notification service if needed
      });
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

    // Fetch payment details
    try {
      const paymentResponse = await axios.get(`http://localhost:${envConfig().payment_service_port}/api/v1/payments/order/${id}`);
      return { ...order, payment: paymentResponse.data };
    } catch (error) {
      // Payment might not exist yet, just return order
      return { ...order, payment: null };
    }
  }

  async findAll(userId: string): Promise<any[]> {
    const orders = await this.orderModel.find({ userId }).populate('shippingLocationId').lean().exec();
    
    return Promise.all(orders.map(async (order: any) => {
      try {
        const paymentResponse = await axios.get(`http://localhost:${envConfig().payment_service_port}/api/v1/payments/order/${order._id}`);
        return { ...order, payment: paymentResponse.data };
      } catch (error) {
        return { ...order, payment: null };
      }
    }));
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
    this.notificationClient.emit('notify_order', {
      orderId: order._id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      status: order.status,
    });

    return order;
  }
}
