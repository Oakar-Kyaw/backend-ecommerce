import { Module } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { EmailModule } from './email.module';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationUserWorker } from './worker/notification-user.worker.service';
import { NotificationWorker } from './worker/notification.worker.service';

@Module({
  imports: [
    NotificationModule, 
    EmailModule],
  controllers: [],
  providers: [
     NotificationWorker,
    NotificationUserWorker, 
    PrismaService],
})
export class AppModule {}
