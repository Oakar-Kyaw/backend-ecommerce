// src/app.module.ts
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductModule } from './product.module';
import { CategoryModule } from './categories/category.module';
import { RequestLoggerMiddleware } from '../../../libs/logs/logs-implementation';

@Module({
  imports: [ProductModule, CategoryModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
