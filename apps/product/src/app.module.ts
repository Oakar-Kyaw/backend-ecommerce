// src/app.module.ts
import { Module } from '@nestjs/common';
import { ProductModule } from './product.module';
import { CategoryModule } from './categories/category.module';

@Module({
  imports: [ProductModule, CategoryModule],
})
export class AppModule {}
