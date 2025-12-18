import { Module } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { EmailModule } from './email.module';
import { NotificationWorker } from './notification.worker';
import { PublishMessageModule } from 'libs/queue/publish.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [PublishMessageModule, NotificationModule, EmailModule],
  controllers: [],
  providers: [NotificationWorker, PrismaService],
})
export class AppModule {}
