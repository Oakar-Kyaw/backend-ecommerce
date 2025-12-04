import { PartialType } from '@nestjs/swagger';
import { CreateShippingFeeDto } from './create-shipping-fee.dto';

export class UpdateShippingFeeDto extends PartialType(CreateShippingFeeDto) {}
