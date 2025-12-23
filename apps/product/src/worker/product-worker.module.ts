import { Module } from '@nestjs/common';
import { PrismaService } from 'apps/product/prisma/prisma.service';
import { ProductUserWorker } from './product-user.worker.service';
import { ProductBrandWorker } from './product-brand.worker.service';

@Module({
  providers: [ProductUserWorker, ProductBrandWorker, PrismaService ],
})
export class ProductWorkerModule {}
