import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument, PaymentProvider, PaymentStatus } from './schemas/payment.schema';
import { Transaction, TransactionDocument, TransactionStatus, TransactionType } from './schemas/transaction.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { envConfig } from 'libs/config/envConfig';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {
    const stripeKey = envConfig().stripe_secret_key;
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-01-27.acacia' as any,
      });
    } else {
      console.warn('STRIPE_SECRET_KEY is not set. Stripe integration will not work.');
    }
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { provider, amount, currency, paymentMethodId, orderId, userId } = createPaymentDto;

    // Create initial payment record
    const payment = new this.paymentModel({
      orderId,
      userId,
      amount,
      currency: currency || 'MMK',
      provider,
      status: PaymentStatus.PENDING,
    });
    await payment.save();

    if (provider === PaymentProvider.STRIPE) {
      if (!paymentMethodId) {
         throw new BadRequestException('Payment method ID is required for Stripe');
      }
      return this.processStripePayment(payment, paymentMethodId);
    }

    // Handle other providers or return pending for manual/redirect flows
    return payment;
  }

  private async processStripePayment(payment: PaymentDocument, paymentMethodId: string): Promise<Payment> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured on the server');
    }

    let transactionStatus = TransactionStatus.PENDING;
    let providerResponse: any = null;
    let transactionId: string | null = null;

    try {
      // Create PaymentIntent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: payment.amount, 
        currency: 'usd', 
        payment_method: paymentMethodId,
        confirm: true,
        return_url: 'http://localhost:3000/payment/success', 
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never'
        }
      });

      providerResponse = paymentIntent;
      transactionId = paymentIntent.id;

      if (transactionId) {
        payment.transactionId = transactionId;
      }
      payment.metadata = paymentIntent;

      if (paymentIntent.status === 'succeeded') {
        payment.status = PaymentStatus.COMPLETED;
        transactionStatus = TransactionStatus.SUCCESS;
      } else {
        payment.status = PaymentStatus.FAILED;
        transactionStatus = TransactionStatus.FAILED;
      }

      await payment.save();
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = { error: error.message };
      await payment.save();
      
      transactionStatus = TransactionStatus.FAILED;
      providerResponse = { error: error.message };
      throw new BadRequestException(`Stripe payment failed: ${error.message}`);
    } finally {
        // Log the transaction
        const transaction = new this.transactionModel({
            paymentId: payment._id,
            amount: payment.amount,
            currency: 'usd', // Should match what was sent to Stripe
            provider: PaymentProvider.STRIPE,
            transactionId: transactionId || 'N/A',
            type: TransactionType.CHARGE,
            status: transactionStatus,
            metadata: providerResponse,
        });
        await transaction.save();
    }
    
    return payment;
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
