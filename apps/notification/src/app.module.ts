import { Module } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { EmailModule } from './email.module';
import { NotificationWorkerModule } from './worker/notification.worker.module';

@Module({
  imports: [
    NotificationModule, 
    EmailModule,
    NotificationWorkerModule, // ← Add this
  ],
  controllers: [], // Controllers are in child modules
  providers: [],   // Clean!
})
export class AppModule {}