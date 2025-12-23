import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { BrandMeta, BrandSchema } from '../schemas/brand.shema';
import { ProductMeta, ProductSchema } from '../schemas/product.schema';
import { OrderUserWorker } from './order-user.worker.service';
import { OrderBrandWorker } from './order-brand.worker.service';
import { OrderProductWorker } from './order-product.worker.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BrandMeta.name, schema: BrandSchema },
      { name: ProductMeta.name, schema: ProductSchema },
    ]),
  ],
  providers: [OrderUserWorker, OrderBrandWorker, OrderProductWorker],
  exports: [OrderUserWorker, OrderBrandWorker, OrderProductWorker],
})
export class OrderWorkerModule {}
