import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentType {
  COD = 'COD',
  KPAY = 'KPAY',
  WAVEPAY = 'WAVEPAY',
  CREDIT_CARD = 'CREDIT_CARD'
}

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsOptional()
  brandId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  size?: string;
}

class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsString()
  @IsOptional()
  placeId?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsNumber()
  @IsOptional()
  subTotal?: number;

  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @IsNumber()
  @IsOptional()
  tax?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  existShippingAddress?: boolean;

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  // @IsNotEmpty()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
}
