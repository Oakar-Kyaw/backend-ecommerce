
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
import { RoleEnum } from './create-user.dto';

// ===== USER ENTITY RESPONSE =====
export class UserResponseDto {
//  @ApiProperty({ example: 'uuid-123' })
  @Expose()
  readonly id: string;

//  @ApiProperty({ example: 'xxxxxx' })
  @Expose()
  readonly photoUrl: string;

  // @ApiProperty({
  //   description: "User's last name",
  //   example: "Doe",
  // })
  @Expose()
  readonly firstName?: string;

  // @ApiProperty({
  //   description: "User's last name",
  //   example: "Doe",
  // })
  @Expose()
  readonly lastName?: string;

  // @ApiProperty({
  //   description: "User's last name",
  //   example: "Doe",
  // })
  @Expose()
  readonly createdAt?: Date;
  
  // @ApiProperty({
  //   description: "User's last name",
  //   example: "Doe",
  // })
  @Expose()
  readonly updatedAt?: Date;

  //@ApiProperty({ example: 'john@example.com' })
  @Expose()
  readonly email: string;

  //@ApiProperty({ example: Role.ADMIN, enum: Role })
  @Expose()
  readonly role: RoleEnum;

  //@ApiProperty({ example: '555-555-5555' })
  @Expose()
  readonly phone: string;

  //@ApiProperty({ example: '1990-01-01T00:00:00.000Z', required: false })
  @Expose()
  readonly dateOfBirth?: string;

  //@ApiProperty({ example: false, required: false })
  @Expose()
  readonly isDeleted?: boolean;

  //@Exclude()
  @Exclude()
  readonly password: string;

  // @ApiProperty({
  //     description: "USER IDENTIFICATION CARD",
  //     type: String,
  //     example: "7/pkn",
  // })    
  @Expose()   
  readonly identification?: string;

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
