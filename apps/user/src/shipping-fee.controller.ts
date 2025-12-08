import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ShippingFeeService } from './shipping-fee.service';
import { CreateShippingFeeDto } from '../dto/create-shipping-fee.dto';
import { UpdateShippingFeeDto } from '../dto/update-shipping-fee.dto';

@Controller('api/v1/shipping-fees')
export class ShippingFeeController {
  constructor(private readonly service: ShippingFeeService) {}

  @Post()
  create(@Body() dto: CreateShippingFeeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('country') country?: string,
    @Query('weight') weight?: string,
    @Query('minWeight') minWeight?: string,
    @Query('maxWeight') maxWeight?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll({ search, country, weight, minWeight, maxWeight, sortBy, sortOrder, page, pageSize });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: any) {
    if (!file) throw new Error('File is required');
    return this.service.import(file.buffer);
  }

  @Get('import/template')
  async template(@Res() res: Response) {
    const buffer = this.service.generateTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=shipping-fee-template.xlsx',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export')
  async export(@Res() res: Response) {
    const buffer = await this.service.export();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=shipping-fees.xlsx',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShippingFeeDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
