import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
//import { LoginDto } from './dto/login.dto';
import { Public } from '../../../libs/decorator/public.decorators';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
//import { LoginResponseDto } from './dto/login-response.dto';
import { Serialize } from '../../../libs/interceptor/response.interceptor';
import { LoginDto } from '../dto/login.dto';
import { GoogleLoginDto } from '../dto/google-login.dto';
import { FacebookLoginDto } from '../dto/facebook-login.dto';
import { AppleLoginDto } from '../dto/apple-login.dto';
import { LoginResponseDto, LogOutResponseDto } from '../dto/login-response.dto';
import { envConfig } from 'libs/config/envConfig';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiResponse({ type: LoginResponseDto })
  @Serialize(LoginResponseDto)
  login(@Body() data: LoginDto) {
    console.log('log', data);
    return this.authService.signIn(data);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('google')
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({ type: LoginResponseDto })
  @Serialize(LoginResponseDto)
  googleLogin(@Body() data: GoogleLoginDto) {
    return this.authService.googleLogin(data);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('facebook')
  @ApiBody({ type: FacebookLoginDto })
  @ApiResponse({ type: LoginResponseDto })
  @Serialize(LoginResponseDto)
  facebookLogin(@Body() data: FacebookLoginDto) {
    return this.authService.facebookLogin(data);
  }

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('apple')
  @ApiBody({ type: AppleLoginDto })
  @ApiResponse({ type: LoginResponseDto })
  @Serialize(LoginResponseDto)
  appleLogin(@Body() data: AppleLoginDto) {
    return this.authService.appleLogin(data);
  }

  @Post('logout')
  @ApiResponse({ type: LogOutResponseDto })
  @Serialize(LogOutResponseDto)
  loginout(
    @Headers('Authorization') authorizationHeader: string,
    @Body('deviceToken') deviceToken?: string,
  ) {
    return this.authService.signOut(authorizationHeader, deviceToken);
  }

  @Public()
  @Get('refresh')
  @ApiResponse({ type: LoginResponseDto })
  @Serialize(LoginResponseDto)
  refreshToken(@Headers('Authorization') authorizationHeader: string) {
    const token = authorizationHeader.split(' ')[1];
    return this.authService.refreshToken(token);
  }

  @Post('device-tokens')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { userIds: { type: 'array', items: { type: 'number' } } },
    },
  })
  async getDeviceTokens(@Body() body: { userIds: number[] }) {
    return this.authService.getDeviceTokens(body.userIds);
  }
}
