import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ShippingLocation } from './shipping-location.schema';

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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ShippingLocation' })
  shippingLocationId: ShippingLocation;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
