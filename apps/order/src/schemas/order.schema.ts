import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ShippingLocation } from './shipping-location.schema';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED'
}

export enum PaymentType {
  COD = 'COD',
  KPAY = 'KPAY',
  WAVEPAY = 'WAVEPAY',
  CREDIT_CARD = 'CREDIT_CARD'
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  userId: string;

  @Prop({
    required: true,
    type: [
      {
        productId: String,
        brandId: Number,
        quantity: Number,
        price: Number,
        color: String,
        size: String,
        name: String,
        image: String,
      },
    ],
  })
  items: {
    productId: string;
    brandId: number;
    quantity: number;
    price: number;
    color?: string;
    size?: string;
    name?: string;
    image?: string;
  }[];

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

  @Prop({ required: false, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ required: false, enum: PaymentType, default: PaymentType.COD })
  paymentType: PaymentType;

  @Prop({
    type: [
      {
        brandId: Number,
        status: {
          type: String,
          enum: OrderStatus,
          default: OrderStatus.PENDING,
        },
      },
    ],
  })
  brandStatuses: { brandId: number; status: OrderStatus }[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ShippingLocation' })
  shippingLocationId: ShippingLocation;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
