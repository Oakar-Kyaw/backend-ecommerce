import { Expose, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateShippingFeeDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value ? String(value).trim() : null))
  country: string;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : null))
  weightKg: number;

  @Expose()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? Number(value) : null))
  price: number;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? String(value).trim().toUpperCase() : 'MMK',
  )
  currency?: string;
}
