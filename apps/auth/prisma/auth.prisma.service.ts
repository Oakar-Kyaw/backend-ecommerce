import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/auth';

@Injectable()
export class AuthPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
          try {
            await this.$connect();
            console.log(`Auth Database connected`);
          } catch (e) {
            console.error(`Auth Database Prisma connection failed`, e);
          }
        }

        async onModuleDestroy() {
          try {
            await this.$disconnect();
            console.log(`Auth Database Prisma disconnected`);
          } catch (e) {
            console.error(`Auth Database Prisma disconnection failed`, e);
          }
        }
}

export const AUTH_PRISMA = AuthPrismaService