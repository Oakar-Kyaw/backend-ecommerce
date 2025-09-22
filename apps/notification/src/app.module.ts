import { Module } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { EmailModule } from './email.module';

@Module({
  imports: [
    NotificationModule,
    EmailModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}