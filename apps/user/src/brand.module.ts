import { Module } from '@nestjs/common';
import { GlobalConfigModule } from 'libs/config/envConfig';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { PrismaService } from '../prisma/prisma.service';
import { FileUpload } from 'libs/utils/file-upload';
import { UserModule } from './user.module';
import { EventPublisherService } from './event-publisher.service';
import { PublishMessageModule } from 'libs/queue/publish.module';
import { BrandUserService } from './brand-user.service';

@Module({
  imports: [GlobalConfigModule, UserModule, PublishMessageModule],
  controllers: [BrandController],
  providers: [BrandService, PrismaService, BrandUserService, FileUpload, EventPublisherService],
})
export class BrandModule {}
