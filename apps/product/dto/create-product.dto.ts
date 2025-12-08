import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  weight: string;

  @IsString()
  @IsNotEmpty()
  discountPercent: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  colors: string; // JSON string

  @IsString()
  @IsNotEmpty()
  sizes: string; // JSON string
}

export interface ParsedColor {
  id: string;
  name: string;
  hex: string;
}

export interface ParsedSize {
  id: string;
  name: string;
  price: number;
  quantities: Record<string, number>;
}
