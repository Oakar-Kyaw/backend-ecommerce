import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class AppleLoginDto {
  @ApiProperty({ example: 'eyJraWQiOiJBSU8...' })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiProperty({ example: 'fcm_token_123' })
  @IsString()
  @IsOptional()
  deviceToken?: string;

  @ApiProperty({ example: { os: 'iOS', model: 'iPhone 15' } })
  @IsObject()
  @IsOptional()
  deviceInfo?: any;
}
