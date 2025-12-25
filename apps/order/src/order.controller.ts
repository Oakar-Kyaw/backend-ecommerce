import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('api/v1/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get('analytics/admin')
  getAdminAnalytics(@Query('year') year: number) {
    return this.orderService.getAdminAnalytics(Number(year));
  }

  @Get('analytics/brand/:brandId')
  getBrandAnalytics(
    @Param('brandId') brandId: number,
    @Query('year') year: number,
  ) {
    return this.orderService.getBrandAnalytics(Number(brandId), Number(year));
  }

  @Get()
  findAll(@Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.orderService.findAll(page, pageSize);
  }

  @Get("details")
  findDetails(
    @Query('userId') userId: string,
    @Query("startDate") startDate: Date,
    @Query("endDate") endDate: Date,
  ) {
    return this.orderService.findDetails(userId, startDate, endDate);
  }

  @Get("detail/:id")
  findDetailById(@Param('id') id: string) {
    return this.orderService.findDetailById(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.orderService.findByUser(userId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.orderService.updateStatus(id, status);
  }

  @Patch(':id/brand-status')
  updateBrandStatus(
    @Param('id') id: string,
    @Body('brandId') brandId: number,
    @Body('status') status: string,
  ) {
    return this.orderService.updateBrandStatus(id, brandId, status);
  }
}
