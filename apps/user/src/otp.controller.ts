import {
  Body,
  Controller,
  Post,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UsersService } from './user.service';
import { SendOtpDto, VerifyOtpDto } from '../dto/otp.dto';
import { Public } from '../../../libs/decorator/public.decorators';
import { ServerErrorResponseDto } from '../../../libs/interceptor/error-response';

@ApiTags('OTP')
@Controller('api/v1/otp')
export class OtpController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post('send')
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({
    status: 201,
    description: 'OTP sent successfully',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  async sendOtp(@Body() body: SendOtpDto) {
    return this.usersService.sendOtp(body);
  }

  @Public()
  @Post('verify')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(AnyFilesInterceptor())
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const otp = body.otp || body.code;
    if (!otp) {
      throw new BadRequestException('OTP code is required');
    }
    return this.usersService.verifyOtp({ ...body, otp });
  }
}
