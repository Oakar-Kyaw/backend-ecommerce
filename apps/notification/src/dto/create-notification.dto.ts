import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class NotificationDto {
  @ApiProperty({
    type: String,
    description: 'Notification Title',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  title: string;

  @ApiProperty({
    type: String,
    description: 'Notification Body',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  body: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Notification Icon / Logo',
  })
  @IsString()
  @IsOptional()
  @Expose()
  icon: string;

  @ApiProperty({
    type: String,
    description: 'Notification Title',
  })
  @IsEnum(Role)
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  role: Role;

  @ApiProperty({
    type: String,
    description: 'Notification Title',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return null;
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  userId?: number;

  @ApiProperty({
    type: String,
    description: 'Notification Title',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return null;
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  brandId?: number;

  @ApiProperty({
    type: String,
    description: 'Notification Title',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return null;
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  branchId?: number;
}

export class SaveNotificationTokenDto {
  @ApiProperty({
    type: String,
    description: 'Client device token',
  })
  @Expose()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Brand ID',
    example: 1,
  })
  @Expose()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return undefined;
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  userId: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Brand ID',
    example: 1,
  })
  @Expose()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return null;
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  brandId?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Branch ID',
    example: 1,
  })
  @Expose()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value) return null;
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
  })
  branchId?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Role',
    example: ` ${Role.ADMIN} | ${Role.SALE} | ${Role.CUSTOMER}`,
  })
  @Expose()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  role: Role;
}

export class SendEmailDto {
  @ApiProperty({
    type: String,
    description: 'Recipient email address',
    example: 'user@example.com',
  })
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    type: String,
    description: 'Email subject',
    example: 'Welcome to our platform!',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Plain text version of the email',
    example: 'Hello, this is a plain text message.',
  })
  @Expose()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'HTML version of the email',
    example: '<h1>Hello</h1><p>This is an HTML email.</p>',
  })
  @Expose()
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Template name for the email',
    example: 'welcome-template',
  })
  @Expose()
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'Template context (variables for rendering)',
    example: { username: 'John Doe', link: 'https://example.com' },
  })
  @Expose()
  @IsOptional()
  context?: any;
}