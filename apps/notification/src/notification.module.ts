import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import * as admin from 'firebase-admin';
import { envConfig } from 'libs/config/envConfig';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from 'apps/prisma/prisma.module';
import { EmailModule } from './email.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    ClientsModule.register([
      {
        name: 'USER',
        transport: Transport.TCP,
        //for local
        options: { host: '0.0.0.0', port: envConfig().user_service_tcp },
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: envConfig().firebase_projectId,
        clientEmail: envConfig().firebase_clientEmail,
        privateKey: envConfig().firebase_privateKey,
      }),
    });
  }
}
