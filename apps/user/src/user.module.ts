import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { GlobalConfigModule } from 'libs/config/envConfig';
import { PublishMessageModule } from 'libs/queue/publish.module';
import { PassportModule } from '@nestjs/passport';
import { FacebookStrategy } from 'libs/strategy/facebook.strategy';
import { GoogleStrategy } from 'libs/strategy/google.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { BrandUserService } from './brand-user.service';
import { EventPublisherService } from './event-publisher.service';

@Module({
  imports: [
    GlobalConfigModule,  
    PublishMessageModule,
    PassportModule.register({defaultStrategy: 'facebook'})
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    BrandUserService,
    EventPublisherService,
    FacebookStrategy,
    GoogleStrategy
  ]
})
export class UserModule {}
