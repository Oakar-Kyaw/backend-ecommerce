// src/app.module.ts
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductModule } from './product.module';
import { CategoryModule } from './categories/category.module';
import { SubCategoryModule } from './subcategories/subcategory.module';
import { RequestLoggerMiddleware } from '../../../libs/loggers/logs-implementation';

@Module({
  imports: [ProductModule, CategoryModule, SubCategoryModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
