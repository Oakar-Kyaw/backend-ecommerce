import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from 'libs/config/envConfig';
import { AuthWorker } from './auth.worker';
import { PublishMessageModule } from 'libs/queue/publish.module';
import { AuthPrismaService } from '../prisma/auth.prisma.service';
import { RequestLoggerMiddleware } from '../../../libs/loggers/logs-implementation';
import { BullModule } from '@nestjs/bullmq';
import { CREATED_USER_QUEUE } from 'libs/queue/constant';

@Module({
  imports: [
    PublishMessageModule,
    BullModule.registerQueue({ name: CREATED_USER_QUEUE }),
    JwtModule.register({
      global: true,
      secret: envConfig().JWTSecret,
      //for production
      signOptions: { expiresIn: '900s' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthWorker, AuthPrismaService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
