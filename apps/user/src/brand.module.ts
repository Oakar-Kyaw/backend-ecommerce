import { Module } from '@nestjs/common';
import { GlobalConfigModule } from 'libs/config/envConfig';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { PrismaService } from '../prisma/prisma.service';
import { FileUpload } from 'libs/utils/file-upload';
import { UserModule } from './user.module';

@Module({
  imports: [GlobalConfigModule, UserModule],
  controllers: [BrandController],
  providers: [BrandService, PrismaService, FileUpload],
})
export class BrandModule {}
