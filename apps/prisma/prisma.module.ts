import { Module } from '@nestjs/common';
import { NotificationPrismaService, UserPrismaService } from './prisma.service';

@Module({
  providers: [NotificationPrismaService, UserPrismaService],
  exports: [NotificationPrismaService, UserPrismaService]
})
export class PrismaModule {}
