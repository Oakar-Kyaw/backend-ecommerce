import { Module } from '@nestjs/common';
import { GlobalConfigModule } from 'libs/config/envConfig';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { PrismaService } from '../prisma/prisma.service';
import { FileUpload } from 'libs/utils/file-upload';

@Module({
  imports: [
    GlobalConfigModule,  
  ],
  controllers: [BrandController],
  providers: [
    BrandService,
    PrismaService,
    FileUpload
  ]
})
export class BrandModule {}
