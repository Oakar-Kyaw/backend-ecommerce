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
//import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// src/enums/role.enum.ts
export enum RoleEnum {
  SALE = "SALE",
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
}


export class CreateUserWithProfileDto {
  // -------- User Base --------
  // @ApiProperty({
  //   description: "User's first name",
  //   example: "John",
  // })
  @Expose()
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: {value: unknown}) => (value ? typeof value === "string" ? value.trim(): value: null))
  readonly firstName?: string;


  // @ApiProperty({
  //   description: "User's last name",
  //   example: "Doe",
  // })
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }: {value: unknown}) => (value ? typeof value === "string" ? value.trim(): value: null))
  readonly lastName?: string;

  // @ApiProperty({
  //   description: "User's email address",
  //   example: "john.doe@example.com",
  // })
  @Expose()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }: {value: unknown}) => (value ? typeof value === "string" ? value.trim().toLowerCase(): Number(value): null))
  readonly email: string;

  // @ApiProperty({
  //   description: "Role of the user",
  //   enum: RoleEnum,
  // //  example: `${Role.SALE} | ${Role.CUSTOMER} | ${Role.ADMIN}`,
  // })
  @Expose()
  @IsNotEmpty()
  @IsEnum(RoleEnum)
  @Transform(({ value }: {value: unknown}) => (value ? typeof value === "string" ? value.trim().toUpperCase(): Number(value): null)) 
  readonly role: RoleEnum;

  // @ApiProperty({
  //   description: "User password",
  //   minLength: 6,
  //   example: "strongPassword123",
  // })
  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Transform(({ value }: {value: unknown}) => (value ? typeof value === "string" ? value.trim(): Number(value): null))
  password: string;

  // @ApiProperty({
  //   description: "User phone number",
  //   example: "+95-097876877868",
  // })
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }: {value: unknown}) => (value ? typeof value === "string" ? value.trim(): Number(value): null))
  readonly phone: string;

  // @ApiProperty({
  //   description: "photo url",
  //   example: "xxxxxxx",
  // })
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  readonly photoUrl: string;


  // @ApiPropertyOptional({
  //   description: "USER IDENTIFICATION CARD",
  //   type: String,
  //   example: "7/pkn",
  // })
  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }: {value: unknown}) => (value ? typeof value === "string" ? value.trim().toLowerCase(): Number(value): null))
  readonly identification?: string;
  
  // @ApiPropertyOptional({
  //   description: "Date of birth (for members only)",
  //   type: String,
  //   format: "date-time",
  //   example: "1990-01-01T00:00:00.000Z",
  // })
  @Expose()
  @IsOptional()
  @IsDateString()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === "string" && value) {
      const d = new Date(value);
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
        .toISOString()
        .replace(/\.\d{3}Z$/, "Z"); // strip milliseconds
    }
    return null;
  })
  readonly dateOfBirth?: string;

}
