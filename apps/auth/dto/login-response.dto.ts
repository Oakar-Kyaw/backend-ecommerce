// src/auth/dto/login-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class LoginUserResponseDto {
  @ApiProperty({ example: 12 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Admin' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'admin@gmail.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: '555-555-5555' })
  @Expose()
  phone: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'Login Successful' })
  @Expose()
  message: string;

  @ApiProperty({ type: () => LoginUserResponseDto })
  @Expose()
  @Type(() => LoginUserResponseDto) // ✅ ensures nested transformation
  data: LoginUserResponseDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  access_token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  refresh_token: string;
}

export class LogOutResponseDto {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({ example: 'Logout Successful' })
  @Expose()
  message: string;
}
