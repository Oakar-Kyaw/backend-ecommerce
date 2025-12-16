import { Injectable } from '@nestjs/common';
import {
  CREATED_BRAND,
  CREATED_BRAND_QUEUE,
  CREATED_USER_JOB,
  CREATED_USER_SERVICE_QUEUE,
  UPDATED_BRAND,
  UPDATED_USER_JOB,
  DELETED_USER_JOB,
  CREATED_NOTIFICATION_SERVICE_QUEUE,
  SEND_EMAIL,
  SEND_ORDER_NOTIFICATION,
} from 'libs/queue/constant';
import { PublishMessage } from 'libs/queue/publish';

@Injectable()
export class EventPublisherService {
  constructor(private readonly publishMessage: PublishMessage) {}

  async sendOrderNotification(data: { orderId: string, userId: string, totalAmount: number, status: string, email: string | null}) {
    // 1️⃣ Publish to user service queue
    await this.publishMessage.publish(CREATED_NOTIFICATION_SERVICE_QUEUE, SEND_ORDER_NOTIFICATION,  {
        orderId: data.orderId,
        userId: data.userId,
        totalAmount: data.totalAmount,
        status: data.status,
        email: data.email
        // name: user name is fetched by notification service if needed
      });
  }    
}
