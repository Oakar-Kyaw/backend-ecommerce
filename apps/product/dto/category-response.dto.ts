import { Expose, Type } from 'class-transformer';

// ===== CATEGORY ENTITY RESPONSE =====
export class CategoryResponseDto {
  @Expose()
  readonly id: number;

  @Expose()
  readonly title: string;

  @Expose()
  readonly description?: string;

  @Expose()
  readonly createdAt?: Date;

  @Expose()
  readonly updatedAt?: Date;
}

// ===== BASE RESPONSE WRAPPER =====
export class BaseCategoryResponseDto<T> {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  data: T;
}

// ===== LIST RESPONSE =====
export class CategoryListResponseDto extends BaseCategoryResponseDto<CategoryResponseDto[]> {
  @Expose()
  message: string = 'LIST_OF_CATEGORIES';

  @Expose()
  @Type(() => CategoryResponseDto)
  declare data: CategoryResponseDto[];
}

// ===== SINGLE RESPONSE =====
export class CategoryByIdResponseDto extends BaseCategoryResponseDto<CategoryResponseDto> {
  @Expose()
  message: string = 'CATEGORY_BY_ID';

  @Expose()
  declare data: CategoryResponseDto;
}

// ===== CREATED RESPONSE =====
export class CreatedCategoryResponseDto extends BaseCategoryResponseDto<CategoryResponseDto> {
  @Expose()
  message: string = 'CREATED_CATEGORY';

  @Expose()
  declare data: CategoryResponseDto;
}

// ===== UPDATED RESPONSE =====
export class UpdatedCategoryResponseDto extends BaseCategoryResponseDto<CategoryResponseDto> {
  @Expose()
  message: string = 'UPDATED_CATEGORY';

  @Expose()
  declare data: CategoryResponseDto;
}

// ===== DELETED RESPONSE =====
export class DeletedCategoryResponseDto extends BaseCategoryResponseDto<CategoryResponseDto> {
  @Expose()
  message: string = 'DELETED_CATEGORY';

  @Expose()
  declare data: CategoryResponseDto;
}

// ===== Expose Category Info =====
export class ICategoryInfoDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  description?: string;
}
