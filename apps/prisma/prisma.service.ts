import { PrismaFactory } from './prisma.factory';

// Tokens for DI
export const USER_PRISMA = 'UserPrismaService';
export const NOTIFICATION_PRISMA = 'NotificationPrismaService';
export const AUTH_PRISMA = 'AuthPrismaService';

// Providers
export const UserPrismaProvider = PrismaFactory.create({
  clientName: 'user',
  provideName: USER_PRISMA,
});

export const NotificationPrismaProvider = PrismaFactory.create({
  clientName: 'notification',
  provideName: NOTIFICATION_PRISMA,
});

export const AuthPrismaProvider = PrismaFactory.create({
  clientName: 'auth',
  provideName: AUTH_PRISMA,
});
