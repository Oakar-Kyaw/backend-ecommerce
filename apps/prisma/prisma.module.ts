import { Module } from '@nestjs/common';
import { AuthPrismaService, NotificationPrismaService, UserPrismaService } from './prisma.service';

@Module({
  providers: [NotificationPrismaService, UserPrismaService, AuthPrismaService],
  exports: [NotificationPrismaService, UserPrismaService, AuthPrismaService]
})
export class PrismaModule {}
