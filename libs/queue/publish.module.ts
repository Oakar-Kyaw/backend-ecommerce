// queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PublishMessage } from './publish';
import { CREATED_USER_QUEUE } from './constant';
import { envConfig } from 'libs/config/envConfig';

@Module({
  imports: [
    BullModule.forRoot({
        connection: envConfig().environment === 'deployment' ? {
            host: envConfig().redis_host,
            port: envConfig().redis_port,
        } : {
        url: envConfig().redis_url, // your rediss://... URL
        tls: {}, // important for rediss://
      },
    }),
    BullModule.registerQueue({ name: CREATED_USER_QUEUE }),
  ],
  providers: [PublishMessage],
  exports: [PublishMessage],
})
export class PublishMessageModule {}
