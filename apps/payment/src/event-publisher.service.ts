import { Injectable } from '@nestjs/common';
import {
  CREATED_NOTIFICATION_SERVICE_QUEUE,
  CREATED_PAYMENT_SERVICE_QUEUE,
  SEND_PAYMENT_NOTIFICATION,
} from 'libs/queue/constant';
import { PublishMessage } from 'libs/queue/publish';

@Injectable()
export class EventPublisherService {
  constructor(private readonly publishMessage: PublishMessage) {}

  async sendPaymentNotification(data: {
    orderId: string;
    userId: string;
    amount: number;
    status: string;
    email: string | null;
  }) {
    // 1️⃣ Publish to notification service queue
    await this.publishMessage.publish(
      CREATED_NOTIFICATION_SERVICE_QUEUE,
      SEND_PAYMENT_NOTIFICATION,
      {
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        status: data.status,
        email: data.email || null,
        // name: user name is fetched by notification service if needed
      },
    );
  }
}
