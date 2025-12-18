import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MinLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GenderEnum, RoleEnum } from './create-user.dto';
import { Transform } from 'class-transformer';

export class SendOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'signup', required: false })
  @IsString()
  @IsOptional()
  mode?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'signup', required: false })
  @IsString()
  @IsOptional()
  mode?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsString()
  @IsOptional()
  otp?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  // Optional fields for user creation on OTP verification
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'CUSTOMER', enum: RoleEnum, required: false })
  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;

  @ApiProperty({ example: 'MALE', enum: GenderEnum, required: false })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123456789', required: false })
  @IsOptional()
  @IsString()
  identification?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value ? Number(value) : null))
  brandId?: number;
}
