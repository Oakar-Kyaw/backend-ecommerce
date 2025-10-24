import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { PublishMessage } from 'libs/queue/publish';
import { PRISMA } from '../prisma/prisma.service';

@Injectable()
export class BrandService {
  constructor(
    @Inject(PRISMA) private readonly prisma,
  ) {}

  // ===== CREATE BRAND =====
  async create(createBrandDto: CreateBrandDto) {
    const { name, code } = createBrandDto;

    // Check duplicate name or code
    const existingBrand = await this.prisma.brand.findFirst({
      where: {
        OR: [
          { name },
          { code },
        ]
      },
    });

    if (existingBrand) {
      throw new ConflictException('Brand name or code already exists');
    }

    const brand = await this.prisma.brand.create({
      data: {
        ...createBrandDto,
      },
    });

    return {
      success: true,
      message: 'CREATED_BRAND',
      data: brand,
    };
  }

  // ===== FIND ALL BRANDS =====
  async findAll(query: { isDeleted?: boolean; name?: string; code?: string }) {
    const where: any = { isDeleted: false };

    if (query?.isDeleted !== undefined) where.isDeleted = query.isDeleted;
    if (query?.name) where.name = query.name;
    if (query?.code) where.code = query.code;

    const brands = await this.prisma.brand.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    return {
      success: true,
      message: 'LIST_OF_BRANDS',
      data: brands,
    };
  }

  // ===== FIND BRAND BY ID =====
  async findOne(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });

    if (!brand) throw new NotFoundException(`Brand with ID ${id} not found`);

    return {
      success: true,
      message: 'BRAND_BY_ID',
      data: brand,
    };
  }

  // ===== UPDATE BRAND =====
  async update(id: number, updateBrandDto: UpdateBrandDto) {
    const existingBrand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!existingBrand) throw new NotFoundException(`Brand with ID ${id} not found`);

    // Check if another brand has same name or code
    const otherBrand = await this.prisma.brand.findFirst({
      where: {
        NOT: { id },
        OR: [
          { name: updateBrandDto.name },
          { code: updateBrandDto.code },
        ],
      },
    });

    if (otherBrand) {
      throw new ConflictException('Brand name or code already exists in another brand');
    }

    const updatedBrand = await this.prisma.brand.update({
      where: { id },
      data: { ...updateBrandDto },
    });


    return {
      success: true,
      message: 'UPDATED_BRAND',
      data: updatedBrand,
    };
  }

  // ===== SOFT DELETE BRAND =====
  async softDelete(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException(`Brand with ID ${id} not found`);

    const deletedBrand = await this.prisma.brand.update({
      where: { id },
      data: { isDeleted: true },
    });


    return {
      success: true,
      message: 'DELETED_BRAND',
      data: deletedBrand,
    };
  }
}
