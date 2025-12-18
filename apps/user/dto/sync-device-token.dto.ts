import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum SyncAction {
  ADD = 'add',
  REMOVE = 'remove',
}

export class DeviceInfoDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'ios', required: false })
  deviceType?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'iPhone 13', required: false })
  deviceName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '15.0', required: false })
  osVersion?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '1.0.0', required: false })
  appVersion?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: '127.0.0.1', required: false })
  ipAddress?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: 40.7128, required: false })
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: -74.006, required: false })
  longitude?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'New York, US', required: false })
  location?: string;
}

export class SyncDeviceTokenDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ example: 1 })
  userId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'token_123' })
  deviceToken: string;

  @IsNotEmpty()
  @IsEnum(SyncAction)
  @ApiProperty({ example: 'add', enum: SyncAction })
  action: SyncAction;

  @IsOptional()
  @ApiProperty({ type: DeviceInfoDto, required: false })
  deviceInfo?: DeviceInfoDto;
}
