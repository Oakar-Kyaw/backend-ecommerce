import { Module } from '@nestjs/common';
import { SubCategoryService } from './subcategory.service';
import { SubCategoryController } from './subcategory.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [SubCategoryController],
  providers: [SubCategoryService, PrismaService],
  exports: [SubCategoryService],
})
export class SubCategoryModule {}
