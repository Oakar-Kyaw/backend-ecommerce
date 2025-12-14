import { Controller, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoginResponseDto } from '../dto/login-response.dto';
import { Serialize } from '../../../libs/interceptor/response.interceptor';

@ApiTags('Session')
@Controller('api/session')
export class SessionController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiBearerAuth()
  @ApiResponse({ type: LoginResponseDto })
  @Serialize(LoginResponseDto)
  getSession(@Headers('Authorization') authorizationHeader: string) {
    return this.authService.getSession(authorizationHeader);
  }
}
