import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { EventPublisherService } from './event-publisher.service';

@Controller('api/v1/payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.findByOrder(orderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }
}
