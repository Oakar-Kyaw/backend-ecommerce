import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'USD', description: 'Currency code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'US Dollar', description: 'Currency name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '$', description: 'Currency symbol' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ example: 1.0, description: 'Exchange rate relative to base currency' })
  @IsNumber()
  @IsNotEmpty()
  exchangeRate: number;

  @ApiProperty({ example: false, description: 'Is default currency', required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ example: true, description: 'Is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
