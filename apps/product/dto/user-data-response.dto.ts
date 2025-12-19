import { Expose, Type } from 'class-transformer';
import { ProductResponseDto } from './product-response.dto';

export class UserResponseDto {
  @Expose()
  readonly id: number;

  @Expose()
  readonly userId: number;

  @Expose()
  readonly email: string;

  @Expose()
  readonly phone?: string;

  @Expose()
  readonly isDeleted?: boolean;

  @Expose()
  readonly role: string;
}

// ===== USER FAVORITE ENTITY RESPONSE =====
export class UserFavoriteResponseDto {
  @Expose()
  readonly id: number;

  @Expose()
  @Type(() => UserResponseDto)
  readonly user: ProductResponseDto;

  @Expose()
  @Type(() => ProductResponseDto)
  readonly product: ProductResponseDto;
}

// ===== BASE RESPONSE WRAPPER =====
export class BaseUserFavoriteResponseDto<T> {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  data: T;
}

// ===== LIST RESPONSE =====
export class UserFavoriteListResponseDto extends BaseUserFavoriteResponseDto<
  UserFavoriteResponseDto[]
> {
  @Expose()
  message: string = 'LIST_OF_USER_FAVORITES';

  @Expose()
  @Type(() => UserFavoriteResponseDto)
  declare data: UserFavoriteResponseDto[];
}


// ===== CREATED RESPONSE =====
export class CreatedUserFavoriteResponseDto extends BaseUserFavoriteResponseDto<UserFavoriteResponseDto> {
  @Expose()
  message: string = 'CREATED_USER_FAVORITE';

  @Expose()
  declare data: UserFavoriteResponseDto;
}

// ===== DELETED RESPONSE =====
export class DeletedUserFavoriteResponseDto extends BaseUserFavoriteResponseDto<UserFavoriteResponseDto> {
  @Expose()
  message: string = 'DELETED_USER_FAVORITE';

  @Expose()
  declare data: UserFavoriteResponseDto;
}

// ===== ADD TO CART ENTITY RESPONSE =====
export class AddToCartResponseDto {
  @Expose()
  readonly id: number;

  @Expose()
  @Type(() => ProductResponseDto)
  readonly product: ProductResponseDto;
}

// ===== BASE RESPONSE WRAPPER =====
export class BaseAddToCartResponseDto<T> {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @Expose()
  data: T;
}

// ===== LIST RESPONSE =====
export class AddToCartListResponseDto extends BaseAddToCartResponseDto<
  AddToCartResponseDto[]
> {
  @Expose()
  message: string = 'LIST_OF_ADD_TO_CART_ITEMS';

  @Expose()
  @Type(() => AddToCartResponseDto)
  declare data: AddToCartResponseDto[];
}

// ===== SINGLE RESPONSE =====
export class AddToCartByIdResponseDto extends BaseAddToCartResponseDto<AddToCartResponseDto> {
  @Expose()
  message: string = 'ADD_TO_CART_BY_ID';

  @Expose()
  declare data: AddToCartResponseDto;
}

// ===== CREATED RESPONSE =====
export class CreatedAddToCartResponseDto extends BaseAddToCartResponseDto<AddToCartResponseDto> {
  @Expose()
  message: string = 'CREATED_ADD_TO_CART_ITEM';

  @Expose()
  declare data: AddToCartResponseDto;
}


// ===== DELETED RESPONSE =====
export class DeletedAddToCartResponseDto extends BaseAddToCartResponseDto<AddToCartResponseDto> {
  @Expose()
  message: string = 'DELETED_ADD_TO_CART_ITEM';

  @Expose()
  declare data: AddToCartResponseDto;
}


