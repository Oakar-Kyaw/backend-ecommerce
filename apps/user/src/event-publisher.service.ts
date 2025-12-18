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
  CREATED_ORDER_SERVICE_QUEUE,
} from 'libs/queue/constant';
import { PublishMessage } from 'libs/queue/publish';

@Injectable()
export class EventPublisherService {
  constructor(private readonly publishMessage: PublishMessage) {}

  async createUser(service_queue,user) {
    // 1️⃣ Publish to user service queue
    await this.publishMessage.publish(service_queue, CREATED_USER_JOB, {
      userId: user.id,
      email: user.email,
      phone: user.phone ?? null,
      password: user.password ?? null,
      role: user.role ?? 'CUSTOMER',
    });
  }

  async userUpdated(service_queue, user) {
    console.log("event to: ", service_queue, UPDATED_USER_JOB)
    await this.publishMessage.publish(service_queue, UPDATED_USER_JOB, {
      userId: user.id,
      email: user.email,
      phone: user.phone ?? null,
      password: user.password ?? null,
      role: user.role ?? 'CUSTOMER',
    });
  }

  async userDeleted(service_queue, userId: number) {
    await this.publishMessage.publish(service_queue, DELETED_USER_JOB, {
      userId,
    });
  }

  brandCreated(brand){
      this.publishMessage.publish(CREATED_BRAND_QUEUE, CREATED_BRAND, {
        brandId: brand.id,
        brandName: brand.name,
        brandImage: brand.imageUrl
      })
  }

  brandUpdated(brand){
      this.publishMessage.publish(CREATED_BRAND_QUEUE, UPDATED_BRAND, {
        brandId: brand.id,
        brandName: brand.name,
        brandImage: brand.imageUrl
      })
  }

  sendEmail(data: {to: string, subject: string, html: string}){
     this.publishMessage.publish(CREATED_NOTIFICATION_SERVICE_QUEUE, SEND_EMAIL, {
        to: data.to,
        subject: data.subject,
        html: data.html
      })
  }
}
