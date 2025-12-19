import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class FacebookLoginDto {
  @ApiProperty({ example: 'EAAGm0PX4ZCpsBAJ...' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({ example: 'fcm_token_123' })
  @IsString()
  @IsOptional()
  deviceToken?: string;

  @ApiProperty({ example: { os: 'Android', model: 'Pixel 7' } })
  @IsObject()
  @IsOptional()
  deviceInfo?: any;
}
