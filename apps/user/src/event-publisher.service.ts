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

  async createUser(service_queue, user) {
    // 1️⃣ Publish to user service queue
    await this.publishMessage.publish(service_queue, CREATED_USER_JOB, {
      userId: user.id,
      email: user.email,
      phone: user.phone ?? null,
      password: user.password ?? null,
      role: user.role ?? 'CUSTOMER',
    });
  }
  // async createUser(user) {
  //   // 1️⃣ Publish to user service queue
  //   await this.publishMessage.publish(CREATED_USER_SERVICE_QUEUE, CREATED_USER_JOB, {
  //     userId: user.id,
  //     email: user.email,
  //     phone: user.phone ?? null,
  //     password: user.password ?? null,
  //     role: user.role ?? 'CUSTOMER',
  //   });
  // }

  async createUserForNotiFicationService(user) {
    // 1️⃣ Publish to user service queue
    await this.publishMessage.publish(
      CREATED_NOTIFICATION_SERVICE_QUEUE,
      CREATED_USER_JOB,
      {
        userId: user.id,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role ?? 'CUSTOMER',
      },
    );
  }

  //push to order service
  async createUserForOrderService(user) {
    console.log('user');
    // 1️⃣ Publish to order service queue
    await this.publishMessage.publish(
      CREATED_ORDER_SERVICE_QUEUE,
      CREATED_USER_JOB,
      {
        userId: user.id,
        email: user.email,
        phone: user.phone ?? null,
        role: user.role ?? 'CUSTOMER',
      },
    );
  }

  userUpdated(user) {
    return this.publishMessage.publish(
      CREATED_USER_SERVICE_QUEUE,
      UPDATED_USER_JOB,
      {
        userId: user.id,
        email: user.email,
        phone: user.phone ?? null,
        password: user.password ?? null,
        role: user.role ?? 'CUSTOMER',
      },
    );
  }

  userDeleted(userId: number) {
    return this.publishMessage.publish(
      CREATED_USER_SERVICE_QUEUE,
      DELETED_USER_JOB,
      {
        userId,
      },
    );
  }

  brandCreated(brand) {
    this.publishMessage.publish(CREATED_BRAND_QUEUE, CREATED_BRAND, {
      brandId: brand.id,
      brandName: brand.name,
      brandImage: brand.imageUrl,
    });
  }

  brandUpdated(brand) {
    this.publishMessage.publish(CREATED_BRAND_QUEUE, UPDATED_BRAND, {
      brandId: brand.id,
      brandName: brand.name,
      brandImage: brand.imageUrl,
    });
  }

  sendEmail(data: { to: string; subject: string; html: string }) {
    this.publishMessage.publish(
      CREATED_NOTIFICATION_SERVICE_QUEUE,
      SEND_EMAIL,
      {
        to: data.to,
        subject: data.subject,
        html: data.html,
      },
    );
  }
}
