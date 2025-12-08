import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaService } from 'apps/product/prisma/prisma.service';
import { FileUpload } from 'libs/utils/file-upload';

@Module({
  imports: [],
  controllers: [ProductController],
  providers: [ProductService, PrismaService, FileUpload],
})
export class ProductModule {}
