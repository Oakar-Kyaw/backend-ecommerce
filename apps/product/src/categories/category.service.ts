import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from 'apps/product/dto/create-category.dto';
import { UpdateCategoryDto } from 'apps/product/dto/update-category.dto';
import { PRISMA } from 'apps/product/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(PRISMA) private readonly prisma,
  ) {}

  // ===== CREATE CATEGORY =====
  async create(createCategoryDto: CreateCategoryDto) {
    const { title } = createCategoryDto;

    // Check duplicate title
    const existingCategory = await this.prisma.category.findFirst({
      where: { title },
    });

    if (existingCategory) {
      throw new ConflictException('Category title already exists');
    }

    const category = await this.prisma.category.create({
      data: { ...createCategoryDto },
    });

    return {
      success: true,
      message: 'CREATED_CATEGORY',
      data: category,
    };
  }

  // ===== FIND ALL CATEGORIES =====
  async findAll(query: { title?: string }) {
    const where: any = {};

    if (query?.title) where.title = query.title;

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    return {
      success: true,
      message: 'LIST_OF_CATEGORIES',
      data: categories,
    };
  }

  // ===== FIND CATEGORY BY ID =====
  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) throw new NotFoundException(`Category with ID ${id} not found`);

    return {
      success: true,
      message: 'CATEGORY_BY_ID',
      data: category,
    };
  }

  // ===== UPDATE CATEGORY =====
  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({ where: { id } });

    if (!existingCategory) throw new NotFoundException(`Category with ID ${id} not found`);

    // Check if another category has same title
    const otherCategory = await this.prisma.category.findFirst({
      where: {
        NOT: { id },
        title: updateCategoryDto.title,
      },
    });

    if (otherCategory) {
      throw new ConflictException('Category title already exists in another category');
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: { ...updateCategoryDto },
    });

    return {
      success: true,
      message: 'UPDATED_CATEGORY',
      data: updatedCategory,
    };
  }

  // ===== SOFT DELETE CATEGORY =====
  async softDelete(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) throw new NotFoundException(`Category with ID ${id} not found`);

    const deletedCategory = await this.prisma.category.update({
      where: { id },
      data: { isDeleted: true },
    });

    return {
      success: true,
      message: 'DELETED_CATEGORY',
      data: deletedCategory,
    };
  }
}
