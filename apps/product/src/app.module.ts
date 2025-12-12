// src/app.module.ts
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductModule } from './product.module';
import { CategoryModule } from './categories/category.module';
import { SubCategoryModule } from './subcategories/subcategory.module';
import { RequestLoggerMiddleware } from '../../../libs/loggers/logs-implementation';
import { ShippingFeeModule } from './shipping/shipping-fee.module';

@Module({
  imports: [ProductModule, CategoryModule, SubCategoryModule, ShippingFeeModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
