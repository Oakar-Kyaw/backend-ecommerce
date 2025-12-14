import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const { items, shippingFee = 0, tax = 0 } = createOrderDto;

    // Calculate subtotal from items
    const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Calculate total amount
    const totalAmount = subTotal + shippingFee + tax;

    const createdOrder = new this.orderModel({
      ...createOrderDto,
      subTotal,
      totalAmount,
    });
    return createdOrder.save();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return order;
  }

  async findAll(userId: string): Promise<Order[]> {
    return this.orderModel.find({ userId }).exec();
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
    return order;
  }
}
