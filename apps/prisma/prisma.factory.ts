import { Injectable, OnModuleInit, Provider, Type } from '@nestjs/common';

interface PrismaFactoryConfig {
  clientName: 'user' | 'auth' | 'notification'; // Use enum instead of path
  provideName: string;
}

// Static mapping that webpack CAN analyze
const PRISMA_CLIENTS = {
  user: () => require('@prisma/user').PrismaClient,
  auth: () => require('@prisma/auth').PrismaClient,
  notification: () => require('@prisma/notification').PrismaClient,
} as const;

export class PrismaFactory {
  static create({ clientName, provideName }: PrismaFactoryConfig): Provider {
    let PrismaClass: Type<any>;

    try {
      // Use the static mapping
      const ClientLoader = PRISMA_CLIENTS[clientName];
      if (!ClientLoader) {
        throw new Error(`No Prisma client configured for: ${clientName}`);
      }

      const Client = ClientLoader();
      
      if (!Client) {
        throw new Error(`Prisma Client not found for ${clientName}`);
      }

      @Injectable()
      class GeneratedPrismaService extends Client implements OnModuleInit {
        async onModuleInit() {
          try {
            await this.$connect();
            console.log(`${clientName} Prisma connected`);
          } catch (e) {
            console.error(`${clientName} Prisma connection failed`, e);
          }
        }

        async onModuleDestroy() {
          try {
            await this.$disconnect();
            console.log(`${clientName} Prisma disconnected`);
          } catch (e) {
            console.error(`${clientName} Prisma disconnection failed`, e);
          }
        }
      }

      PrismaClass = GeneratedPrismaService;
    } catch (e) {
      console.warn(`Prisma client '${clientName}' not found. Using NullPrismaService`, e);

      @Injectable()
      class NullPrismaService implements OnModuleInit {
        async onModuleInit() {}
        async onModuleDestroy() {}
      }

      PrismaClass = NullPrismaService;
    }

    return {
      provide: provideName,
      useClass: PrismaClass,
    };
  }
}
