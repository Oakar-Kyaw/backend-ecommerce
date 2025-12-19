import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PrismaService } from 'apps/product/prisma/prisma.service';
import { FileUpload } from 'libs/utils/file-upload';
import { UserData } from './user/user.data';

@Module({
  imports: [],
  controllers: [ProductController],
  providers: [ProductService, PrismaService, FileUpload, UserData],
})
export class ProductModule {}
