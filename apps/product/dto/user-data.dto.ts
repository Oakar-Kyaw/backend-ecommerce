import { IsInt, IsOptional, IsNotEmpty } from 'class-validator';
import { Transform, Expose } from 'class-transformer';

export class CreateUserFavoriteDto {
  @Expose()
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  readonly userId: number;

  @Expose()
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  readonly productId: number;
}

export class CreateAddToCartDto {
  @Expose()
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  readonly userId: number;

  @Expose()
  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }) => Number(value))
  readonly productId: number;

}
