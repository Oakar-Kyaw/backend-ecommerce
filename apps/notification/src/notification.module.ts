import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import * as admin from 'firebase-admin';
import { envConfig } from 'libs/config/envConfig';
import { EmailModule } from './email.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    EmailModule,
    // // ClientsModule.register([
    //   {
    //     name: 'USER',
    //     transport: Transport.TCP,
    //     //for local
    //     options: { host: '0.0.0.0', port: envConfig().user_service_tcp },
    //   },
    // ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, 
    PrismaService
  ],
  exports: [NotificationService],
})
export class NotificationModule {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: envConfig().firebase_projectId,
        clientEmail: envConfig().firebase_clientEmail,
        privateKey: envConfig().firebase_privateKey?.replace(/\\n/g, '\n'),
      }),
    });
  }
}
