import { Module } from '@nestjs/common';
import { UserPrismaProvider, NotificationPrismaProvider, AuthPrismaProvider } from './prisma.service';

@Module({
  providers: [UserPrismaProvider, NotificationPrismaProvider, AuthPrismaProvider],
  exports: [UserPrismaProvider, NotificationPrismaProvider, AuthPrismaProvider],
})
export class PrismaModule {}
