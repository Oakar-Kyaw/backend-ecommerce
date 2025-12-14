import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, type: [{ productId: String, quantity: Number, price: Number, color: String, size: String }] })
  items: { productId: string; quantity: number; price: number; color?: string; size?: string }[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  subTotal: number;

  @Prop({ required: true, default: 0 })
  shippingFee: number;

  @Prop({ required: true, default: 0 })
  tax: number;

  @Prop({ required: true, default: 'MMK' })
  currency: string;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: Object })
  shippingAddress: {
    address: string;
    city: string;
    phone: string;
  };
}

export const OrderSchema = SchemaFactory.createForClass(Order);
