import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/product';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
          try {
            await this.$connect();
            console.log(`Product Database connected`);
          } catch (e) {
            console.error(`Product Database Prisma connection failed`, e);
          }
        }

        async onModuleDestroy() {
          try {
            await this.$disconnect();
            console.log(`Product Database Prisma disconnected`);
          } catch (e) {
            console.error(`Product Database Prisma disconnection failed`, e);
          }
        }
}

export const PRISMA = PrismaService