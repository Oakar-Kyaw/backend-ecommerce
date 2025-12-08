import { Expose, Type } from 'class-transformer';
import { CategoryResponseDto } from './category-response.dto';

// ===== SUBCATEGORY ENTITY RESPONSE =====
export class SubCategoryResponseDto {
  @Expose()
  readonly id: number;

  @Expose()
  readonly title: string;

  @Expose()
  readonly description?: string;

  @Expose()
  readonly categoryId: number;

  @Expose()
  @Type(() => CategoryResponseDto)
  readonly category?: CategoryResponseDto;

  @Expose()
  readonly createdAt?: Date;

  @Expose()
  readonly updatedAt?: Date;
}

// ===== BASE RESPONSE WRAPPER =====
export class BaseSubCategoryResponseDto<T> {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  data: T;
}

// ===== LIST RESPONSE =====
export class SubCategoryListResponseDto extends BaseSubCategoryResponseDto<
  SubCategoryResponseDto[]
> {
  @Expose()
  message: string = 'LIST_OF_SUBCATEGORIES';

  @Expose()
  @Type(() => SubCategoryResponseDto)
  declare data: SubCategoryResponseDto[];

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

// ===== SINGLE RESPONSE =====
export class SubCategoryByIdResponseDto extends BaseSubCategoryResponseDto<SubCategoryResponseDto> {
  @Expose()
  message: string = 'SUBCATEGORY_BY_ID';

  @Expose()
  declare data: SubCategoryResponseDto;
}

// ===== CREATED RESPONSE =====
export class CreatedSubCategoryResponseDto extends BaseSubCategoryResponseDto<SubCategoryResponseDto> {
  @Expose()
  message: string = 'CREATED_SUBCATEGORY';

  @Expose()
  declare data: SubCategoryResponseDto;
}

// ===== UPDATED RESPONSE =====
export class UpdatedSubCategoryResponseDto extends BaseSubCategoryResponseDto<SubCategoryResponseDto> {
  @Expose()
  message: string = 'UPDATED_SUBCATEGORY';

  @Expose()
  declare data: SubCategoryResponseDto;
}

// ===== DELETED RESPONSE =====
export class DeletedSubCategoryResponseDto extends BaseSubCategoryResponseDto<SubCategoryResponseDto> {
  @Expose()
  message: string = 'DELETED_SUBCATEGORY';

  @Expose()
  declare data: SubCategoryResponseDto;
}
