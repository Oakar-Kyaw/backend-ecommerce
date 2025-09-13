import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { GlobalConfigModule } from 'libs/config/envConfig';
import { PrismaModule } from '../schema/prisma/prisma.module';

@Module({
  imports: [GlobalConfigModule, PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UserModule {}
