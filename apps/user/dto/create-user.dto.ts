import { Transform, Expose, Type, Exclude } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
  IsNumber,
  IsArray,
  IsInt,
  ValidateIf,
  IsBoolean,
  ValidateNested,
} from "class-validator";
//import { Role } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "../schema/generated/prisma";

export class CreateUserWithProfileDto {
  // -------- User Base --------
  @ApiProperty({
    description: "User's first name",
    example: "John",
  })
  @Expose()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  readonly firstName: string;

  @ApiProperty({
    description: "User's middle name",
    example: "Middle",
  })
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  readonly middleName?: string;

  @ApiProperty({
    description: "User's last name",
    example: "Doe",
  })
  @Expose()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  readonly lastName?: string;

  @ApiProperty({
    description: "User's email address",
    example: "john.doe@example.com",
  })
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  readonly email: string;

  @ApiProperty({
    description: "Role of the user",
    enum: Role,
    example: `${Role.SALE} | ${Role.CUSTOMER} | ${Role.ADMIN}`,
  })
  @Expose()
  @IsNotEmpty()
  @IsEnum(Role)
  readonly role: Role;

  @ApiProperty({
    description: "User password",
    minLength: 6,
    example: "strongPassword123",
  })
  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Transform(({ value }) => {
    console.log("password:", value);
    return typeof value === "string" ? value.trim() : value;
  })
  readonly password: string;

  @ApiProperty({
    description: "User phone number",
    example: "+95-097876877868",
  })
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  readonly phone: string;

  @ApiProperty({
    description: "photo url",
    example: "xxxxxxx",
  })
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  readonly photoUrl: string;

  // -------- Soft-delete flag --------
  @ApiPropertyOptional({
    description: "Soft delete flag",
    default: false,
    example: false,
  })
  @Expose()
  @IsOptional()
  @IsBoolean()
  readonly isDeleted?: boolean;


  @ApiPropertyOptional({
    description: "USER IDENTIFICATION CARD",
    type: String,
    example: "7/pkn",
  })
  @Expose()
  @IsOptional()
  @IsString()
  readonly identification?: string;

  // -------- Customer-only fields --------
  
  @ApiPropertyOptional({
    description: "Date of birth (for members only)",
    type: String,
    format: "date-time",
    example: "1990-01-01T00:00:00.000Z",
  })
  @Expose()
  @ValidateIf((o) => o.role === Role.CUSTOMER)
  @IsOptional()
  @IsDateString()
  readonly dateOfBirth?: string;

  @ApiPropertyOptional({
    description: "user's interest",
    type: String,
    example: "Music, Movie",
  })
  @Expose()
  @ValidateIf((o) => o.role === Role.CUSTOMER)
  @IsOptional()
  @IsString()
  readonly interest?: string;

  // -------- Sale-only fields --------
  @ApiPropertyOptional({
    description: "Bio (for trainers only)",
    example: "Experienced personal trainer specializing in weightlifting",
  })
  @Expose()
  @ValidateIf((o) => o.role === Role.SALE)
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  readonly bio?: string;

  @ApiPropertyOptional({
    description: "Sale's salary",
    type: Number,
    example: 5000,
  })
  @Expose()
  @ValidateIf((o) => o.role === Role.SALE)
  @IsOptional()
  @IsNumber()
  readonly salary?: number;
}
