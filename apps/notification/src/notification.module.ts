import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import * as admin from "firebase-admin";
import { envConfig } from 'libs/config/envConfig';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from 'apps/prisma/prisma.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    PrismaModule, 
    ClientsModule.register([{
          name: 'USER',
          transport: Transport.TCP,
          //for local
          options: { host: 'localhost', port: envConfig().user_service_tcp }, // user service port
          //options: { host: 'user', port: envConfig().user_service_tcp }, 
        },
      ])
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
