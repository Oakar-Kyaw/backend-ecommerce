import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  WAVE = 'WAVE',
  KBZ = 'KBZ',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'MMK' })
  currency: string;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ required: true, enum: PaymentProvider })
  provider: PaymentProvider;

  @Prop()
  transactionId: string; // Stripe PaymentIntent ID or similar

  @Prop({ type: Object })
  metadata: any;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
