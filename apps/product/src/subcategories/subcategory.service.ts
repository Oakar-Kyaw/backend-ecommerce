import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubCategoryDto } from 'apps/product/dto/create-subcategory.dto';
import { UpdateSubCategoryDto } from 'apps/product/dto/update-subcategory.dto';
import { PRISMA } from 'apps/product/prisma/prisma.service';
import {
  getPagination,
  buildPaginationResponse,
} from '../../../../libs/utils/pagination';

@Injectable()
export class SubCategoryService {
  constructor(@Inject(PRISMA) private readonly prisma) {}

  // ===== CREATE SUBCATEGORY =====
  async create(createSubCategoryDto: CreateSubCategoryDto) {
    const { title, categoryId } = createSubCategoryDto;

    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId, isDeleted: false },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // Check duplicate title within the same category
    const existingSubCategory = await this.prisma.subCategory.findFirst({
      where: { title, categoryId, isDeleted: false },
    });

    if (existingSubCategory) {
      throw new ConflictException(
        'SubCategory title already exists in this category',
      );
    }

    const subCategory = await this.prisma.subCategory.create({
      data: { ...createSubCategoryDto },
      include: { category: true },
    });

    return {
      success: true,
      message: 'CREATED_SUBCATEGORY',
      data: subCategory,
    };
  }

  // ===== FIND ALL SUBCATEGORIES =====
  async findAll(query: {
    title?: string;
    description?: string;
    categoryId?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  }) {
    const where: any = { isDeleted: false };
    const and: any[] = [];

    if (query?.title)
      and.push({ title: { contains: query.title, mode: 'insensitive' } });
    if (query?.description)
      and.push({
        description: { contains: query.description, mode: 'insensitive' },
      });
    if (query?.categoryId) {
        and.push({ categoryId: Number(query.categoryId) });
    }
    if (query?.search)
      and.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      });

    if (and.length) where.AND = and;

    const page = query?.page ? Number(query.page) : undefined;
    const pageSize = query?.pageSize ? Number(query.pageSize) : undefined;

    const meta = getPagination({ page, pageSize });

    const [subCategories, total] = await Promise.all([
      this.prisma.subCategory.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: meta.skip,
        take: meta.limit,
        include: { category: true },
      }),
      this.prisma.subCategory.count({ where }),
    ]);

    return buildPaginationResponse(
      subCategories,
      meta,
      total,
      'LIST_OF_SUBCATEGORIES',
    );
  }

  // ===== FIND SUBCATEGORY BY ID =====
  async findOne(id: number) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id, isDeleted: false },
      include: { category: true },
    });

    if (!subCategory)
      throw new NotFoundException(`SubCategory with ID ${id} not found`);

    return {
      success: true,
      message: 'SUBCATEGORY_BY_ID',
      data: subCategory,
    };
  }

  // ===== UPDATE SUBCATEGORY =====
  async update(id: number, updateSubCategoryDto: UpdateSubCategoryDto) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id, isDeleted: false },
    });

    if (!subCategory)
      throw new NotFoundException(`SubCategory with ID ${id} not found`);

    if (updateSubCategoryDto.title) {
        const categoryId = updateSubCategoryDto.categoryId || subCategory.categoryId;
        const existing = await this.prisma.subCategory.findFirst({
            where: {
                title: updateSubCategoryDto.title,
                categoryId: categoryId,
                isDeleted: false,
                NOT: { id },
            }
        });
        if (existing) {
             throw new ConflictException('SubCategory title already exists in this category');
        }
    }

    if (updateSubCategoryDto.categoryId) {
         const category = await this.prisma.category.findUnique({
            where: { id: updateSubCategoryDto.categoryId, isDeleted: false },
         });
         if (!category) {
             throw new NotFoundException(`Category with ID ${updateSubCategoryDto.categoryId} not found`);
         }
    }

    const updatedSubCategory = await this.prisma.subCategory.update({
      where: { id },
      data: { ...updateSubCategoryDto },
      include: { category: true },
    });

    return {
      success: true,
      message: 'UPDATED_SUBCATEGORY',
      data: updatedSubCategory,
    };
  }

  // ===== REMOVE SUBCATEGORY =====
  async remove(id: number) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id, isDeleted: false },
    });

    if (!subCategory)
      throw new NotFoundException(`SubCategory with ID ${id} not found`);

    const deletedSubCategory = await this.prisma.subCategory.update({
      where: { id },
      data: { isDeleted: true },
      include: { category: true },
    });

    return {
      success: true,
      message: 'DELETED_SUBCATEGORY',
      data: deletedSubCategory,
    };
  }
}
