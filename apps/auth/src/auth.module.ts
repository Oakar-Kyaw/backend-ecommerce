import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from 'libs/config/envConfig';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from 'apps/prisma/prisma.module';
import { AuthWorker } from './auth.worker';
import { CREATED_USER_QUEUE } from 'libs/queue/constant';
import { PublishMessageModule } from 'libs/queue/publish.module';

@Module({
  imports: [
    PublishMessageModule,
    JwtModule.register({
      global: true,
      secret: envConfig().JWTSecret,
      //for production
      signOptions: { expiresIn: '900s' },
    }), PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthWorker],
})
export class AuthModule {}
