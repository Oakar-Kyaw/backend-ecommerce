import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Delete,
} from '@nestjs/common';
import { ShippingAddressService } from './shipping-address.service';
import { CreateShippingAddressDto } from '../dto/create-shipping-address.dto';
import { Types } from 'mongoose';

@Controller('api/v1/shipping-address')
export class ShippingAddressController {
  constructor(
    private readonly shippingAddressService: ShippingAddressService,
  ) {}

  // 🔹 Create shipping address
  @Post()
  create(@Body() dto: CreateShippingAddressDto) {
    return this.shippingAddressService.create(dto);
  }

  // 🔹 Get all shipping addresses (pagination)
  @Get()
  findAll(
    @Query('userId') userId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.shippingAddressService.findAll(userId, page, pageSize);
  }

  // 🔹 Get shipping address by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shippingAddressService.findOne(id);
  }

  // 🔹 Get shipping addresses by user
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.shippingAddressService.findByUser(userId);
  }

  // 🔹 Update shipping address
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreateShippingAddressDto,
  ) {
    return this.shippingAddressService.update(id, dto);
  }

  // 🔹 Set default shipping address
  @Patch(':id/default')
  setDefault(@Param('id') id: string, @Body('userId') userId: string) {
    return this.shippingAddressService.setDefault(id, userId);
  }

  @Delete(":id")
  delete(@Param("id") id: string){
    return this.shippingAddressService.delete(id);
  }
}
