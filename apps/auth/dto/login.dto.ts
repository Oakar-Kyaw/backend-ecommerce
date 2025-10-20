import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ----------- Request DTO -----------
export class LoginDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'admin@gmail.com', required: false })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '555-555-5555', required: false })
  phone?: string;

  @IsNotEmpty()
  //@IsString()
  @ApiProperty({ example: 'admin123' })
  password: string;
}
