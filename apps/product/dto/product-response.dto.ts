import { Expose, Type, Transform } from 'class-transformer';
import { UserFavoriteResponseDto } from './user-data-response.dto';

export class ProductColorImagesDto {
  @Expose()
  front: string | null;

  @Expose()
  back: string | null;

  @Expose()
  sideL: string | null;

  @Expose()
  sideR: string | null;
}

export class ProductColorResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  hex: string;

  @Expose()
  @Type(() => ProductColorImagesDto)
  images: ProductColorImagesDto;
}

export class ProductSizeResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  price: number;

  @Expose()
  @Transform(({ obj }) => obj.quantities)
  quantities: Record<string, number>;
}

export class BrandDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  description: string;

  @Expose()
  photoUrl: string;
}

export class ProductResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  type: string;

  @Expose()
  weight: string;

  @Expose()
  discountPercent: number;

  @Expose()
  brandId: number;

  @Expose()
  @Type(() => BrandDto)
  brand: BrandDto;

  @Expose()
  categoryId: string;

  @Expose()
  subcategoryId: string;

  @Expose()
  description: string;

  @Expose()
  mainImage: string;

  @Expose()
  @Type(() => ProductColorResponseDto)
  colors: ProductColorResponseDto[];

  @Expose()
  @Type(() => ProductSizeResponseDto)
  sizes: ProductSizeResponseDto[];

  @Expose()
  @Type(() => UserFavoriteResponseDto)
  userFavorites: UserFavoriteResponseDto[];
}

export class ProductItemResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @Type(() => ProductResponseDto)
  data: ProductResponseDto;
}

export class ProductListResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  @Type(() => ProductResponseDto)
  data: ProductResponseDto[];

  @Expose()
  part: number;

  @Expose()
  page: number;

  @Expose()
  pageSize: number;

  @Expose()
  limit: number;

  @Expose()
  skip: number;

  @Expose()
  totalPages: number;
}
