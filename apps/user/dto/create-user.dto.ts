import { Transform, Expose } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
  IsInt,
} from "class-validator";

export enum RoleEnum {
  SALE = "SALE",
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
}

export enum GenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export class CreateUserWithProfileDto {
  // -------- User Base --------
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? String(value).trim() : null))
  readonly firstName?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? String(value).trim() : null))
  readonly lastName?: string;

  @Expose()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => (value ? String(value).trim().toLowerCase() : null))
  readonly email: string;

  @Expose()
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  @Transform(({ value }) => (value ? String(value).trim().toUpperCase() : null))
  readonly role: RoleEnum;

  @Expose()
  @IsOptional()
  @IsEnum(GenderEnum)
  @Transform(({ value }) => (value ? String(value).trim().toUpperCase() : 'MALE'))
  readonly gender?: GenderEnum;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Transform(({ value }) => (value ? String(value).trim() : null))
  password: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? String(value).trim() : null))
  readonly phone?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? String(value).trim() : null))
  readonly photoUrl?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? String(value).trim().toLowerCase() : null))
  readonly identification?: string;

  @Expose()
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (typeof value === "string" && value) {
      const d = new Date(value);
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
        .toISOString()
        .replace(/\.\d{3}Z$/, "Z"); // strip milliseconds
    }
    return null;
  })
  readonly dateOfBirth?: string;

  // -------- Brand Assignment --------
  @Expose()
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value ? Number(value) : null))
  readonly brandId?: number; // assign user to a brand
}
