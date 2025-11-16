import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { Transform, Expose } from 'class-transformer';

export class CreateCategoryDto {
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
}