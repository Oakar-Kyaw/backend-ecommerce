import { IsString, IsOptional, IsNotEmpty, IsInt } from 'class-validator';
import { Transform, Expose } from 'class-transformer';

export class CreateSubCategoryDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  readonly title: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  readonly description?: string;

  @Expose()
  @IsNotEmpty()
  @IsInt()
  readonly categoryId: number;
}
