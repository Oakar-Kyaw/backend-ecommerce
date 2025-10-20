import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { GlobalConfigModule } from 'libs/config/envConfig';
import { PrismaModule } from 'apps/prisma/prisma.module';
import { PublishMessageModule } from 'libs/queue/publish.module';

@Module({
  imports: [
    GlobalConfigModule, 
    PrismaModule, 
    PublishMessageModule
  ],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UserModule {}
