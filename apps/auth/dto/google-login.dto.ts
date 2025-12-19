import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmYifQ...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({ example: 'fcm_token_123' })
  @IsString()
  @IsOptional()
  deviceToken?: string;

  @ApiProperty({ example: { os: 'iOS', model: 'iPhone 13' } })
  @IsObject()
  @IsOptional()
  deviceInfo?: any;
}
