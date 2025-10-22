import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { GlobalConfigModule } from 'libs/config/envConfig';
import { PrismaModule } from 'apps/prisma/prisma.module';
import { PublishMessageModule } from 'libs/queue/publish.module';
import { PassportModule } from '@nestjs/passport';
import { FacebookStrategy } from 'libs/strategy/facebook.strategy';
import { GoogleStrategy } from 'libs/strategy/google.strategy';

@Module({
  imports: [
    GlobalConfigModule, 
    PrismaModule, 
    PublishMessageModule,
    PassportModule.register({defaultStrategy: 'facebook'})
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    FacebookStrategy,
    GoogleStrategy
  ]
})
export class UserModule {}
