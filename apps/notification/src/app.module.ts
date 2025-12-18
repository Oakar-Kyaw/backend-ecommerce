import { Module } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { EmailModule } from './email.module';
import { NotificationWorker } from './notification.worker';
import { PublishMessageModule } from 'libs/queue/publish.module';
import { PrismaService } from '../prisma/prisma.service';
import { BullModule } from '@nestjs/bullmq';
import { CREATED_NOTIFICATION_SERVICE_QUEUE } from 'libs/queue/constant';
import { envConfig } from 'libs/config/envConfig';

@Module({
  imports: [PublishMessageModule, NotificationModule, EmailModule],
  controllers: [],
  providers: [NotificationWorker, PrismaService],
})
export class AppModule {}
