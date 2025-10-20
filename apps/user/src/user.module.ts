import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { envConfig, GlobalConfigModule } from 'libs/config/envConfig';
import { PrismaModule } from 'apps/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { CREATED_USER_QUEUE } from 'libs/queue/constant';

@Module({
  imports: [GlobalConfigModule, PrismaModule, 
    BullModule.registerQueue({
      name: CREATED_USER_QUEUE,
    }),
    BullModule.forRoot({
      connection: {
        host: envConfig().redis_host,
        port: envConfig().redis_port,
      },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UserModule {}
