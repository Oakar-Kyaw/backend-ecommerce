import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Payment,
  PaymentDocument,
  PaymentProvider,
  PaymentStatus,
} from './schemas/payment.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
  TransactionType,
} from './schemas/transaction.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { envConfig } from 'libs/config/envConfig';
import Stripe from 'stripe';
import { ClientProxy } from '@nestjs/microservices';
import { EventPublisherService } from './event-publisher.service';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
    private readonly eventPublisher: EventPublisherService,
  ) {
    const stripeKey = envConfig().stripe_secret_key;
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-01-27.acacia' as any,
      });
    } else {
      console.warn(
        'STRIPE_SECRET_KEY is not set. Stripe integration will not work.',
      );
    }
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { provider, amount, currency, paymentMethodId, orderId, userId } =
      createPaymentDto;

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
        throw new BadRequestException(
          'Payment method ID is required for Stripe',
        );
      }
      return this.processStripePayment(payment, paymentMethodId);
    }

    // Handle other providers or return pending for manual/redirect flows
    return payment;
  }

  async findByOrder(orderId: string): Promise<Payment | null> {
    return this.paymentModel.findOne({ orderId }).sort({ createdAt: -1 });
  }

  private async processStripePayment(
    payment: PaymentDocument,
    paymentMethodId: string,
  ): Promise<Payment> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured on the server');
    }

    let transactionStatus = TransactionStatus.PENDING;
    let providerResponse: any = null;
    const transactionId: string | null = null;

    try {
      // Create PaymentIntent
      // const paymentIntent = await this.stripe.paymentIntents.create({
      //   amount: payment.amount,
      //   currency: 'usd',
      //   payment_method: paymentMethodId,
      //   confirm: true,
      //   return_url: 'http://localhost:3000/payment/success',
      //   automatic_payment_methods: {
      //       enabled: true,
      //       allow_redirects: 'never'
      //   }
      // });

      // providerResponse = paymentIntent;
      // transactionId = paymentIntent.id;

      // if (transactionId) {
      //   payment.transactionId = transactionId;
      // }
      // payment.metadata = paymentIntent;

      // if (paymentIntent.status === 'succeeded') {
      //   payment.status = PaymentStatus.COMPLETED;
      //   transactionStatus = TransactionStatus.SUCCESS;
      // } else {
      //   payment.status = PaymentStatus.FAILED;
      //   transactionStatus = TransactionStatus.FAILED;
      // }

      // await payment.save();

      // Emit notification
      const userData = await this.userModel.findOne({ userId: payment.userId });
      this.eventPublisher.sendPaymentNotification({
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        status: payment.status,
        email: userData?.email || null,
      });
      // this.notificationClient.emit('notify_payment', {
      //   orderId: payment.orderId,
      //   userId: payment.userId,
      //   amount: payment.amount,
      //   status: payment.status,
      // });
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = { error: error.message };
      await payment.save();

      transactionStatus = TransactionStatus.FAILED;
      providerResponse = { error: error.message };

      // Emit notification for failure
      const userData = await this.userModel.findOne({ userId: payment.userId });
      this.eventPublisher.sendPaymentNotification({
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        status: PaymentStatus.FAILED,
        email: userData?.email || null,
      });

      throw new BadRequestException(`Stripe payment failed: ${error.message}`);
    } finally {
      // Create transaction record
      await this.transactionModel.create({
        paymentId: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: transactionStatus,
        type: TransactionType.CHARGE,
        provider: payment.provider,
        transactionId: transactionId || `txn_${Date.now()}`,
        providerResponse,
        metadata: {
          paymentMethodId,
          error:
            transactionStatus === TransactionStatus.FAILED
              ? providerResponse?.error
              : null,
        },
      });
    }

    return payment;
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentModel.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }
}
