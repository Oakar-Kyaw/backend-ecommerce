
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsNumber,
  IsDateString,
  IsBoolean,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
//import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RoleEnum } from './create-user.dto';

class CustomerProfileResponseDto {
  
  //@ApiProperty({ example: '1990-01-01T00:00:00.000Z', required: false })
  @Expose()
  readonly dateOfBirth?: string;

  // @ApiProperty({
  //   description: "user's interest",
  //   type: String,
  //   example: "Music, Movie",
  // })
  @Expose()
  readonly interest?: string;                                           
}

class SaleProfileResponseDto {
  //@ApiProperty({ example: 'Fitness trainer bio', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? value.trim() : undefined))
  readonly bio?: string;

  // @ApiProperty({
  //   description: "Sale's salary",
  //   type: Number,
  //   example: 5000,
  // })
  @Expose()
  readonly salary?: number;
}

// ===== USER ENTITY RESPONSE =====
export class UserResponseDto {
//  @ApiProperty({ example: 'uuid-123' })
  @Expose()
  @IsString()
  readonly id: string;

//  @ApiProperty({ example: 'xxxxxx' })
  @Expose()
  @IsString()
  readonly photoUrl: string;

//  @ApiProperty({
  //   description: "User's middle name",
  //   example: "Middle",
  // })
  @Expose()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  readonly middleName?: string;

  // @ApiProperty({
  //   description: "User's last name",
  //   example: "Doe",
  // })
  @Expose()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  readonly lastName?: string;

  //@ApiProperty({ example: 'john@example.com' })
  @Expose()
  @IsEmail()
  @Transform(({ value }) =>  value ? value?.toLowerCase() : undefined)
  readonly email: string;

  //@ApiProperty({ example: Role.ADMIN, enum: Role })
  @Expose()
  @IsEnum(RoleEnum)
  readonly role: RoleEnum;

  //@ApiProperty({ example: '555-555-5555' })
  @Expose()
  @IsString()
  @Transform(({ value }) => value ? value?.trim() : undefined)
  readonly phone: string;

  //@ApiProperty({ example: '1990-01-01T00:00:00.000Z', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  readonly dateOfBirth?: string;

  //@ApiProperty({ example: false, required: false })
  @Expose()
  @IsOptional()
  @IsBoolean()
  readonly isDeleted?: boolean;

  //@Exclude()
  @Expose()
  readonly password: string;

  // @ApiProperty({
  //     description: "USER IDENTIFICATION CARD",
  //     type: String,
  //     example: "7/pkn",
  // })    
  @Expose()   
  readonly identification?: string;

  @Expose()
  @IsOptional()
  @Type(()=>  CustomerProfileResponseDto)
  readonly customerProfile: CustomerProfileResponseDto

  @Expose()
  @IsOptional()
  @Type(()=>  SaleProfileResponseDto)
  readonly saleProfile: SaleProfileResponseDto
}

// ===== BASE RESPONSE WRAPPER =====
export class BaseUserResponseDto<T> {
  // @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  //@ApiProperty({ example: 'Some message' })
  @Expose()
  message: string;

 // @ApiProperty({ type: () => Object })
  @Expose()
  data: T;
}

// ===== LIST RESPONSE =====
export class UserListResponseDto extends BaseUserResponseDto<UserResponseDto[]> {
 // @ApiProperty({ example: 'LIST_OF_USERS' })
  @Expose()
  message: string = 'LIST_OF_USERS';

//  @ApiProperty({ type: () => [UserResponseDto] })
  @Expose()
  @Type(() => UserResponseDto)
  declare data: UserResponseDto[];
}

// ===== SINGLE RESPONSE =====
export class UserByIdResponseDto extends BaseUserResponseDto<UserResponseDto> {
 // @ApiProperty({ example: 'USER_BY_ID' })
  @Expose()
  message: string = 'USER_BY_ID';

//  @ApiProperty({ type: () => UserResponseDto })
  @Expose()
  declare data: UserResponseDto;
}

// ===== CREATED RESPONSE =====
export class CreatedUserResponseDto extends BaseUserResponseDto<UserResponseDto> {
//  @ApiProperty({ example: 'CREATED_USER' })
  @Expose()
  message: string = 'CREATED_USER';

//  @ApiProperty({ type: () => UserResponseDto })
  @Expose()
  declare data: UserResponseDto;
}

// ===== UPDATED RESPONSE =====
export class UpdatedUserResponseDto extends BaseUserResponseDto<UserResponseDto> {
//  @ApiProperty({ example: 'UPDATED_USER' })
  @Expose()
  message: string = 'UPDATED_USER';

//  @ApiProperty({ type: () => UserResponseDto })
  @Expose()
  declare data: UserResponseDto;
}

// ===== DELETED RESPONSE =====
export class DeletedUserResponseDto extends BaseUserResponseDto<UserResponseDto> {
//  @ApiProperty({ example: 'DELETED_USER' })
  @Expose()
  message: string = 'DELETED_USER';

 // @ApiProperty({ type: () => UserResponseDto })
  @Expose()
  declare data: UserResponseDto;
}

// ===== Expose User Data =====
export class IUserInfoDto {
//  @ApiProperty({ example: 4 })
  @Expose()
  id: number;

//  @ApiProperty({ example: 'admin@gmail.com' })
  @Expose()
  email: string;

//  @ApiProperty({ example: 'Admin' })
  @Expose()
  name: string;

//  @ApiProperty({ example: '555-555-5555' })
  @Expose()
  phone: string;

//  @ApiProperty({ example: 'ADMIN', nullable: true })
  @Expose()
  role?: string;
}
