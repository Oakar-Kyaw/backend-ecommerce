import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PRISMA } from '../prisma/prisma.service';
import { CreateShippingFeeDto } from '../dto/create-shipping-fee.dto';
import { UpdateShippingFeeDto } from '../dto/update-shipping-fee.dto';

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

  async findAll(query: { country?: string; minWeight?: string; maxWeight?: string; page?: string; pageSize?: string }) {
    const where: any = { isDeleted: false };
    if (query?.country) where.country = query.country;
    const minW = query?.minWeight ? Number(query.minWeight) : undefined;
    const maxW = query?.maxWeight ? Number(query.maxWeight) : undefined;
    if (minW !== undefined || maxW !== undefined) where.weightKg = {};
    if (minW !== undefined) where.weightKg.gte = minW;
    if (maxW !== undefined) where.weightKg.lte = maxW;

    const page = query?.page ? Number(query.page) : 1;
    const pageSize = query?.pageSize ? Number(query.pageSize) : 20;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.shippingFee.findMany({ where, orderBy: { id: 'desc' }, skip, take: pageSize }),
      this.prisma.shippingFee.count({ where }),
    ]);
    return { success: true, message: 'LIST_OF_SHIPPING_FEES', data: items, meta: { page, pageSize, total } };
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
      const dup = await this.prisma.shippingFee.findFirst({ where: { country, weightKg, isDeleted: false, NOT: { id } } });
      if (dup) throw new ConflictException('SHIPPING_FEE_EXISTS');
    }
    const updated = await this.prisma.shippingFee.update({ where: { id }, data: dto });
    return { success: true, message: 'UPDATED_SHIPPING_FEE', data: updated };
  }

  async remove(id: number) {
    const exists = await this.prisma.shippingFee.findUnique({ where: { id } });
    if (!exists || exists.isDeleted) throw new NotFoundException('NOT_FOUND');
    const deleted = await this.prisma.shippingFee.update({ where: { id }, data: { isDeleted: true } });
    return { success: true, message: 'DELETED_SHIPPING_FEE', data: deleted };
  }
}
