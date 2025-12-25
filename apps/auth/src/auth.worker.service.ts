import { Injectable, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { AUTH_PRISMA } from '../prisma/auth.prisma.service';
import { RedisConsumer } from 'libs/queue/redis.consumer';
import { EVENTS, TYPES } from 'libs/queue/constant';

@Injectable()
export class AuthWorker
  extends RedisConsumer
  implements OnModuleInit
{
  constructor(@Inject(AUTH_PRISMA) private prisma) {
    super(
       EVENTS.USER_EVENT,       // stream
      'auth_group',        // group
      `auth_${process.pid}` // consumer
    );
  }

  async onModuleInit() {
    this.start();
  }

  async handle(data: any) {
    console.log("auth noti", data)
    if (data.type === TYPES.CREATED_USER) {
      await this.prisma.user.upsert({
        where: { userId: data.id },
        update: {
          userId: data.id,
          password: data.password,
          email: data.email,
          phone: data.phone,
          role: data.role,
        },
        create: {
          userId: data.id,
          email: data.email,
          phone: data.phone,
          role: data.role,
          password: data.password,
        },
      });
    }

    if (data.type === TYPES.UPDATED_USER) {
      await this.prisma.user.update({
        where: { userId: data.id },
        data: data,
      });
    }

    if (data.type === TYPES.DELETED_USER) {
      await this.prisma.user.update({
        where: { userId: data.id },
        data: { isDeleted: true },
      });
    }
  }
}
