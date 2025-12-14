import { PartialType } from '@nestjs/swagger';
import { CreateShippingFeeDto } from '../../product/dto/create-shipping-fee.dto';

export class UpdateShippingFeeDto extends PartialType(CreateShippingFeeDto) {}
