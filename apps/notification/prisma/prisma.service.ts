import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  INestApplication,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/notification';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
      console.log(`Notification Database connected`);
    } catch (e) {
      console.error(`Notification Database Prisma connection failed`, e);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      console.log(`Notification Database Prisma disconnected`);
    } catch (e) {
      console.error(`Notification Database Prisma disconnection failed`, e);
    }
  }
}

export const PRISMA = PrismaService;
