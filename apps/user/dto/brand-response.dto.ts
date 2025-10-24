import { Expose, Type } from 'class-transformer';

// ===== BRAND ENTITY RESPONSE =====
export class BrandResponseDto {
  @Expose()
  readonly id: number;

  @Expose()
  readonly name: string;

  @Expose()
  readonly code: string;

  @Expose()
  readonly phone?: string;

  @Expose()
  readonly email?: string;

  @Expose()
  readonly address?: string;

  @Expose()
  readonly description?: string;

  @Expose()
  readonly feedback?: string;

  @Expose()
  readonly info?: string;

  @Expose()
  readonly isDeleted?: boolean;

  @Expose()
  readonly createdAt?: Date;

  @Expose()
  readonly updatedAt?: Date;
}

// ===== BASE RESPONSE WRAPPER =====
export class BaseBrandResponseDto<T> {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  data: T;
}

// ===== LIST RESPONSE =====
export class BrandListResponseDto extends BaseBrandResponseDto<BrandResponseDto[]> {
  @Expose()
  message: string = 'LIST_OF_BRANDS';

  @Expose()
  @Type(() => BrandResponseDto)
  declare data: BrandResponseDto[];
}

// ===== SINGLE RESPONSE =====
export class BrandByIdResponseDto extends BaseBrandResponseDto<BrandResponseDto> {
  @Expose()
  message: string = 'BRAND_BY_ID';

  @Expose()
  declare data: BrandResponseDto;
}

// ===== CREATED RESPONSE =====
export class CreatedBrandResponseDto extends BaseBrandResponseDto<BrandResponseDto> {
  @Expose()
  message: string = 'CREATED_BRAND';

  @Expose()
  declare data: BrandResponseDto;
}

// ===== UPDATED RESPONSE =====
export class UpdatedBrandResponseDto extends BaseBrandResponseDto<BrandResponseDto> {
  @Expose()
  message: string = 'UPDATED_BRAND';

  @Expose()
  declare data: BrandResponseDto;
}

// ===== DELETED RESPONSE =====
export class DeletedBrandResponseDto extends BaseBrandResponseDto<BrandResponseDto> {
  @Expose()
  message: string = 'DELETED_BRAND';

  @Expose()
  declare data: BrandResponseDto;
}

// ===== Expose Brand Info =====
export class IBrandInfoDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  phone?: string;

  @Expose()
  email?: string;

  @Expose()
  isDeleted?: boolean;
}
