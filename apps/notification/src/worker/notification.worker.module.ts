// worker/worker.module.ts
import { Module } from '@nestjs/common';
import { NotificationWorker } from './notification.worker.service';
import { NotificationUserWorker } from './notification-user.worker.service';
import { NotificationModule } from '../notification.module';
import { EmailModule } from '../email.module';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationBrandWorker } from './notification-brand.worker.service';

@Module({
  imports: [
    NotificationModule, // Provides NotificationService
    EmailModule,        // Provides EmailService
  ],
  providers: [
    NotificationWorker,
    NotificationUserWorker,
    NotificationBrandWorker,
    PrismaService,
  ],
})
export class NotificationWorkerModule {}