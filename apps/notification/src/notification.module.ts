import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import * as admin from 'firebase-admin';
import { envConfig } from 'libs/config/envConfig';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailModule } from './email.module';
import { PrismaService } from '../prisma/prisma.service';
import { PublishMessageModule } from 'libs/queue/publish.module';
import { NotificationWorker } from './notification.worker';
import { BullModule } from '@nestjs/bullmq';
import { CREATED_NOTIFICATION_SERVICE_QUEUE } from 'libs/queue/constant';

@Module({
  imports: [
    EmailModule,
    PublishMessageModule,
    BullModule.forRoot({
      connection: {
        host: envConfig().redis_host,
        port: envConfig().redis_port,
        password: envConfig().redis_password,
      },
    }),
    BullModule.registerQueue({
      name: CREATED_NOTIFICATION_SERVICE_QUEUE,
    }),
    // ClientsModule.register([
    //   {
    //     name: 'USER',
    //     transport: Transport.TCP,
    //     //for local
    //     options: { host: '0.0.0.0', port: envConfig().user_service_tcp },
    //   },
    // ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService, NotificationWorker],
  exports: [NotificationService]
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
