import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum TransactionType {
  CHARGE = 'CHARGE',
  REFUND = 'REFUND',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  paymentId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  provider: string;

  @Prop({ required: true })
  transactionId: string; // ID from the provider (e.g., Stripe PaymentIntent ID)

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ required: true, enum: TransactionStatus })
  status: TransactionStatus;

  @Prop({ type: Object })
  metadata: any; // Store full provider response here
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
