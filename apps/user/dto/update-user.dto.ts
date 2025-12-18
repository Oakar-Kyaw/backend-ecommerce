import { PartialType } from '@nestjs/mapped-types';
import { CreateUserWithProfileDto } from './create-user.dto';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateUserWithProfileDto extends PartialType(
  CreateUserWithProfileDto,
) {}

export class UpdateUserPassword {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Transform(({ value }) => (value ? String(value).trim() : null))
  password: string;
}