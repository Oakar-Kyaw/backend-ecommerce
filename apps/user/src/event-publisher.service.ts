import { Injectable } from '@nestjs/common';
import {
  CREATED_BRAND,
  CREATED_BRAND_QUEUE,
  CREATED_USER_JOB,
  CREATED_USER_QUEUE,
  UPDATED_BRAND,
  UPDATED_USER_JOB,
} from 'libs/queue/constant';
import { PublishMessage } from 'libs/queue/publish';

@Injectable()
export class EventPublisherService {
  constructor(private readonly publishMessage: PublishMessage) {}

  async userCreated(user) {
    return this.publishMessage.publish(CREATED_USER_QUEUE, CREATED_USER_JOB, {
      userId: user.id,
      email: user.email,
      phone: user.phone ?? null,
      password: user.password ?? null,
      role: user.role ?? 'CUSTOMER',
    });
  }

  async userUpdated(user) {
    return this.publishMessage.publish(CREATED_USER_QUEUE, UPDATED_USER_JOB, {
      userId: user.id,
      email: user.email,
      phone: user.phone ?? null,
      password: user.password ?? null,
      role: user.role ?? 'CUSTOMER',
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
}
