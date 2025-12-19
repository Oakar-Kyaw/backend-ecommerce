// src/app.module.ts
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductModule } from './product.module';
import { CategoryModule } from './categories/category.module';
import { SubCategoryModule } from './subcategories/subcategory.module';
import { RequestLoggerMiddleware } from '../../../libs/loggers/logs-implementation';
import { ShippingFeeModule } from './shipping/shipping-fee.module';
import { CurrencyModule } from './currency/currency.module';
import { PublishMessageModule } from 'libs/queue/publish.module';
import { ProductWorker } from './product.worker';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ProductModule,
    CategoryModule,
    SubCategoryModule,
    ShippingFeeModule,
    CurrencyModule,
    PublishMessageModule
  ],
  providers:[ProductWorker, PrismaService]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
