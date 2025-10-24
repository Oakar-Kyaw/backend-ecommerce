import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/user';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
          try {
            await this.$connect();
            console.log(`User Database connected`);
          } catch (e) {
            console.error(`User Database Prisma connection failed`, e);
          }
        }

        async onModuleDestroy() {
          try {
            await this.$disconnect();
            console.log(`User Database Prisma disconnected`);
          } catch (e) {
            console.error(`User Database Prisma disconnection failed`, e);
          }
        }
}

export const PRISMA = PrismaService