import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { OtpController } from './otp.controller';
import { UsersService } from './user.service';
import { GlobalConfigModule, envConfig } from 'libs/config/envConfig';
import { PassportModule } from '@nestjs/passport';
import { FacebookStrategy } from 'libs/strategy/facebook.strategy';
import { GoogleStrategy } from 'libs/strategy/google.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { BrandUserService } from './brand-user.service';
import { FileUpload } from 'libs/utils/file-upload';
import * as admin from 'firebase-admin';

@Module({
  imports: [
    GlobalConfigModule,
    PassportModule.register({ defaultStrategy: 'facebook' }),
  ],
  controllers: [UsersController, OtpController],
  providers: [
    UsersService,
    PrismaService,
    BrandUserService,
    FacebookStrategy,
    GoogleStrategy,
    FileUpload,
  ],
  exports: [UsersService],
})
export class UserModule {
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
          privateKey: envConfig().firebase_privateKey?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }
}
