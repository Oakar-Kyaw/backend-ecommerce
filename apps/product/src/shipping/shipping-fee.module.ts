import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShippingFeeService } from './shipping-fee.service';
import { ShippingFeeController } from './shipping-fee.controller';

@Module({
  controllers: [ShippingFeeController],
  providers: [ShippingFeeService, PrismaService],
  exports: [ShippingFeeService],
})
export class ShippingFeeModule {}
