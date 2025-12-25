import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from 'apps/product/dto/create-category.dto';
import { UpdateCategoryDto } from 'apps/product/dto/update-category.dto';
import {
  getPagination,
  buildPaginationResponse,
} from '../../../../libs/utils/pagination';
import { FileUpload } from 'libs/utils/file-upload';
import { PRISMA } from 'apps/product/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly uploadFile: FileUpload,
    @Inject(PRISMA) private readonly prisma
  ) {}

  // ===== CREATE CATEGORY =====
  async create(
    createCategoryDto: CreateCategoryDto,
    file: Express.Multer.File
  ) {
    const { title } = createCategoryDto;
   let photoUrl: string = '';
    // Check duplicate title
    const existingCategory = await this.prisma.category.findFirst({
      where: { title, isDeleted: false },
    });

    if (existingCategory) {
      throw new ConflictException('Category title already exists');
    }

    if (file)
      photoUrl = (
        await this.uploadFile.uploadSingle({ file, folderName: 'categories' })
      ).url;

    const category = await this.prisma.category.create({
      data: { ...createCategoryDto, photoUrl },
    });

    return {
      success: true,
      message: 'CREATED_CATEGORY',
      data: category,
    };
  }

  // ===== FIND ALL CATEGORIES =====
  async findAll(query: {
    title?: string;
    description?: string;
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

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: {
          subCategories: true
        },
        orderBy: { id: 'desc' },
        skip: meta.skip,
        take: meta.limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    console.log("categories", categories)
    return buildPaginationResponse(
      categories,
      meta,
      total,
      'LIST_OF_CATEGORIES',
    );
  }

  // ===== FIND CATEGORY BY ID =====
  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id, isDeleted: false },
    });

    if (!category)
      throw new NotFoundException(`Category with ID ${id} not found`);

    return {
      success: true,
      message: 'CATEGORY_BY_ID',
      data: category,
    };
  }

  // ===== UPDATE CATEGORY =====
  async update(id: number, updateCategoryDto: UpdateCategoryDto, file: Express.Multer.File) {
    let photoUrl = "";

    const existingCategory = await this.prisma.category.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existingCategory)
      throw new NotFoundException(`Category with ID ${id} not found`);

    // Check if another category has same title
    const otherCategory = await this.prisma.category.findFirst({
      where: {
        NOT: { id },
        title: updateCategoryDto.title,
        isDeleted: false,
      },
    });

    if (otherCategory) {
      throw new ConflictException(
        'Category title already exists in another category',
      );
    }
    if (file) {
      if (photoUrl) {
        const deleteKey = photoUrl.split('.com/')[1];
        this.uploadFile.deleteFile(deleteKey);
      }

      photoUrl = (
        await this.uploadFile.uploadSingle({ file, folderName: 'categories' })
      ).url;
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: { ...updateCategoryDto, photoUrl },
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

    if (!category)
      throw new NotFoundException(`Category with ID ${id} not found`);

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
