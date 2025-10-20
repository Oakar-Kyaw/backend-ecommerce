// queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PublishMessage } from './publish';
import { CREATED_USER_QUEUE } from './constant';
import { envConfig } from 'libs/config/envConfig';

@Module({
  imports: [
    BullModule.forRoot({
        connection: {
            host: envConfig().redis_host,
            port: envConfig().redis_port,
        },
    }),
    BullModule.registerQueue({ name: CREATED_USER_QUEUE }),
  ],
  providers: [PublishMessage],
  exports: [PublishMessage],
})
export class PublishMessageModule {}
