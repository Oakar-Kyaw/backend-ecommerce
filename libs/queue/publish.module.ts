// queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PublishMessage } from './publish';
import {
  CREATED_AUTH_SERVICE_QUEUE,
  CREATED_CHAT_SERVICE_QUEUE,
  CREATED_NOTIFICATION_SERVICE_QUEUE,
  CREATED_ORDER_SERVICE_QUEUE,
  CREATED_PAYMENT_SERVICE_QUEUE,
  CREATED_PRODUCT_SERVICE_QUEUE,
  CREATED_USER_SERVICE_QUEUE,
} from './constant';
import { envConfig } from 'libs/config/envConfig';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: envConfig().redis_host,
        port: envConfig().redis_port,
        password: envConfig().redis_password,
      },
    }),
    BullModule.registerQueue({ name: CREATED_USER_SERVICE_QUEUE }),
    BullModule.registerQueue({ name: CREATED_NOTIFICATION_SERVICE_QUEUE }),
    BullModule.registerQueue({ name: CREATED_AUTH_SERVICE_QUEUE }),
    BullModule.registerQueue({ name: CREATED_ORDER_SERVICE_QUEUE }),
    BullModule.registerQueue({ name: CREATED_PRODUCT_SERVICE_QUEUE }),
    BullModule.registerQueue({ name: CREATED_PAYMENT_SERVICE_QUEUE }),
    BullModule.registerQueue({ name: CREATED_CHAT_SERVICE_QUEUE }),
  ],
  providers: [PublishMessage],
  exports: [PublishMessage],
})
export class PublishMessageModule {}
