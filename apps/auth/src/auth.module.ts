import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SessionController } from './session.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from 'libs/config/envConfig';
import { AuthWorker } from './auth.worker';
import { PublishMessageModule } from 'libs/queue/publish.module';
import { AuthPrismaService } from '../prisma/auth.prisma.service';
import { RequestLoggerMiddleware } from '../../../libs/loggers/logs-implementation';
import * as admin from 'firebase-admin';

@Module({
  imports: [
    PublishMessageModule,
    JwtModule.register({
      global: true,
      secret: envConfig().JWTSecret,
      //for production
      signOptions: { expiresIn: '900s' },
    }),
  ],
  controllers: [AuthController, SessionController],
  providers: [AuthService, AuthWorker, AuthPrismaService],
})
export class AuthModule {
  constructor() {
    // Initialize Firebase only if not already initialized
    if (admin.apps.length === 0) {
      console.log(
        'Initializing Firebase with Project ID:',
        envConfig().firebase_projectId,
      );
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: envConfig().firebase_projectId,
          clientEmail: envConfig().firebase_clientEmail,
          privateKey: envConfig().firebase_privateKey,
        }),
      });
    }
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
