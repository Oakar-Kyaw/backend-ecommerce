import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateShippingFeeDto } from '../../dto/create-shipping-fee.dto';
import * as XLSX from 'xlsx';
import { PRISMA } from 'apps/product/prisma/prisma.service';
import { UpdateShippingFeeDto } from 'apps/product/dto/update-shipping-fee.dto';

@Injectable()
export class ShippingFeeService {
  constructor(@Inject(PRISMA) private readonly prisma) {}

  async create(dto: CreateShippingFeeDto) {
    const exists = await this.prisma.shippingFee.findFirst({
      where: { country: dto.country, weightKg: dto.weightKg, isDeleted: false },
    });
    if (exists) throw new ConflictException('SHIPPING_FEE_EXISTS');
    const created = await this.prisma.shippingFee.create({ data: dto });
    return { success: true, message: 'CREATED_SHIPPING_FEE', data: created };
  }

  async findAll(query: {
    search?: string;
    country?: string;
    weight?: string;
    minWeight?: string;
    maxWeight?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: string;
    pageSize?: string;
  }) {
    const where: any = { isDeleted: false };

    // Search
    if (query?.search) {
      const searchNum = Number(query.search);
      where.OR = [
        { country: { contains: query.search, mode: 'insensitive' } },
        ...(isNaN(searchNum) ? [] : [{ weightKg: searchNum }]),
      ];
    }

    // Filters
    if (query?.country) where.country = query.country;

    // Weight Filter
    const exactW = query?.weight ? Number(query.weight) : undefined;
    const minW = query?.minWeight ? Number(query.minWeight) : undefined;
    const maxW = query?.maxWeight ? Number(query.maxWeight) : undefined;

    if (exactW !== undefined && !isNaN(exactW)) {
      where.weightKg = exactW;
    } else if (
      (minW !== undefined && !isNaN(minW)) ||
      (maxW !== undefined && !isNaN(maxW))
    ) {
      where.weightKg = {};
      if (minW !== undefined && !isNaN(minW)) where.weightKg.gte = minW;
      if (maxW !== undefined && !isNaN(maxW)) where.weightKg.lte = maxW;
    }

    let page = query?.page ? Number(query.page) : 1;
    let pageSize = query?.pageSize ? Number(query.pageSize) : 20;

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(pageSize) || pageSize < 1) pageSize = 20;

    const skip = (page - 1) * pageSize;

    // Sorting
    const orderBy: any = {};
    if (query?.sortBy) {
      orderBy[query.sortBy] = query.sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.id = 'desc';
    }

    const [items, total] = await Promise.all([
      this.prisma.shippingFee.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.shippingFee.count({ where }),
    ]);
    return {
      success: true,
      message: 'LIST_OF_SHIPPING_FEES',
      data: items,
      meta: { page, pageSize, total },
    };
  }

  async findOne(id: number) {
    const item = await this.prisma.shippingFee.findUnique({ where: { id } });
    if (!item || item.isDeleted) throw new NotFoundException('NOT_FOUND');
    return { success: true, message: 'SHIPPING_FEE_BY_ID', data: item };
  }

  async update(id: number, dto: UpdateShippingFeeDto) {
    const exists = await this.prisma.shippingFee.findUnique({ where: { id } });
    if (!exists || exists.isDeleted) throw new NotFoundException('NOT_FOUND');
    if (dto.country || dto.weightKg) {
      const country = dto.country ?? exists.country;
      const weightKg = dto.weightKg ?? exists.weightKg;
      const dup = await this.prisma.shippingFee.findFirst({
        where: { country, weightKg, isDeleted: false, NOT: { id } },
      });
      if (dup) throw new ConflictException('SHIPPING_FEE_EXISTS');
    }
    const updated = await this.prisma.shippingFee.update({
      where: { id },
      data: dto,
    });
    return { success: true, message: 'UPDATED_SHIPPING_FEE', data: updated };
  }

  async remove(id: number) {
    const exists = await this.prisma.shippingFee.findUnique({ where: { id } });
    if (!exists || exists.isDeleted) throw new NotFoundException('NOT_FOUND');
    const deleted = await this.prisma.shippingFee.update({
      where: { id },
      data: { isDeleted: true },
    });
    return { success: true, message: 'DELETED_SHIPPING_FEE', data: deleted };
  }

  async export() {
    const items = await this.prisma.shippingFee.findMany({
      where: { isDeleted: false },
      orderBy: [{ country: 'asc' }, { weightKg: 'asc' }],
      select: {
        country: true,
        weightKg: true,
        price: true,
        currency: true,
      },
    });

    const worksheet = XLSX.utils.json_to_sheet(items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ShippingFees');

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }

  async import(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
    };

    for (const [index, row] of data.entries()) {
      try {
        const r = row as any;
        const country = r['country'];
        const weightKg = Number(r['weightKg']);
        const price = Number(r['price']);
        const currency = r['currency'] || 'MMK';

        if (!country || isNaN(weightKg) || isNaN(price)) {
          throw new Error('Invalid data');
        }

        const existing = await this.prisma.shippingFee.findFirst({
          where: { country, weightKg, isDeleted: false },
        });

        if (existing) {
          await this.prisma.shippingFee.update({
            where: { id: existing.id },
            data: { price, currency },
          });
        } else {
          await this.prisma.shippingFee.create({
            data: { country, weightKg, price, currency },
          });
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ row: index + 2, error: error.message });
      }
    }
    return { success: true, message: 'IMPORT_COMPLETED', data: results };
  }

  generateTemplate() {
    const data = [
      { country: 'Myanmar', weightKg: 1.5, price: 3000, currency: 'MMK' },
      { country: 'Singapore', weightKg: 2.0, price: 5000, currency: 'MMK' },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }
}
