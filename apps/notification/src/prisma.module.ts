import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.serverice';

@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
