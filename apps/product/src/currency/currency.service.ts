import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCurrencyDto } from '../../dto/create-currency.dto';
import { UpdateCurrencyDto } from '../../dto/update-currency.dto';
import { PRISMA } from '../../prisma/prisma.service';

import {
  getPagination,
  buildPaginationResponse,
} from '../../../../libs/utils/pagination';

@Injectable()
export class CurrencyService {
  constructor(@Inject(PRISMA) private readonly prisma) {}

  async create(createCurrencyDto: CreateCurrencyDto) {
    const { code } = createCurrencyDto;

    const existingCurrency = await this.prisma.currency.findUnique({
      where: { code },
    });

    if (existingCurrency) {
      throw new ConflictException(`Currency with code ${code} already exists`);
    }

    if (createCurrencyDto.isDefault) {
      // If setting as default, unset other defaults
      await this.prisma.currency.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const currency = await this.prisma.currency.create({
      data: createCurrencyDto,
    });

    return {
      success: true,
      message: 'CREATED_CURRENCY',
      data: currency,
    };
  }

  async findAll(query: {
    search?: string;
    isActive?: boolean;
    page?: string;
    pageSize?: string;
  }) {
    const where: any = {};
    const and: any[] = [];

    if (query?.search) {
      and.push({
        OR: [
          { code: { contains: query.search, mode: 'insensitive' } },
          { name: { contains: query.search, mode: 'insensitive' } },
          { symbol: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    if (query?.isActive !== undefined) {
      // Handle string 'true'/'false' if coming from query params, though Controller might not transform it automatically without pipe
      // Assuming simple boolean or string check.
      const isActive = String(query.isActive) === 'true';
      and.push({ isActive });
    }

    if (and.length) where.AND = and;

    const page = query?.page ? Number(query.page) : undefined;
    const pageSize = query?.pageSize ? Number(query.pageSize) : undefined;

    const meta = getPagination({ page, pageSize });

    const [currencies, total] = await Promise.all([
      this.prisma.currency.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: meta.skip,
        take: meta.limit,
      }),
      this.prisma.currency.count({ where }),
    ]);

    return buildPaginationResponse(
      currencies,
      meta,
      total,
      'LIST_OF_CURRENCIES',
    );
  }

  async findOne(id: number) {
    const currency = await this.prisma.currency.findUnique({
      where: { id },
    });

    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'CURRENCY_DETAILS',
      data: currency,
    };
  }

  async update(id: number, updateCurrencyDto: UpdateCurrencyDto) {
    const existingCurrency = await this.prisma.currency.findUnique({
      where: { id },
    });

    if (!existingCurrency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }

    if (updateCurrencyDto.isDefault) {
      // If setting as default, unset other defaults
      await this.prisma.currency.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updatedCurrency = await this.prisma.currency.update({
      where: { id },
      data: updateCurrencyDto,
    });

    return {
      success: true,
      message: 'UPDATED_CURRENCY',
      data: updatedCurrency,
    };
  }

  async remove(id: number) {
    const existingCurrency = await this.prisma.currency.findUnique({
      where: { id },
    });

    if (!existingCurrency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }

    await this.prisma.currency.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'DELETED_CURRENCY',
    };
  }
}
