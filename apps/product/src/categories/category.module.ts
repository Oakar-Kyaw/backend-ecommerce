import { Module } from '@nestjs/common';
import { GlobalConfigModule } from 'libs/config/envConfig';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PrismaService } from 'apps/product/prisma/prisma.service';

@Module({
  imports: [
    GlobalConfigModule,  
  ],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    PrismaService
  ]
})
export class CategoryModule {}
