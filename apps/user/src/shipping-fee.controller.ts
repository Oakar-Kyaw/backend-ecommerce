import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
    @Query('country') country?: string,
    @Query('minWeight') minWeight?: string,
    @Query('maxWeight') maxWeight?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findAll({ country, minWeight, maxWeight, page, pageSize });
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
