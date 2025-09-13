import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
//import { LoginDto } from './dto/login.dto';
import { Public } from '../../../libs/decorator/public.decorators';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
//import { LoginResponseDto } from './dto/login-response.dto';
import { Serialize } from '../../../libs/interceptor/response.interceptor';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto, LogOutResponseDto } from '../dto/login-response.dto';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Public()
    @Post("login") 
    @ApiBody({type: LoginDto})
    @ApiResponse({type: LoginResponseDto})
    @Serialize(LoginResponseDto)
    login(@Body() data: LoginDto) {
        console.log("log",data)
        return this.authService.signIn(data)
    }

    @Post('logout')
    @ApiResponse({ type: LogOutResponseDto })
    @Serialize(LogOutResponseDto)
    loginout(@Headers('Authorization') authorizationHeader: string) {
        return this.authService.signOut(authorizationHeader);
    }

    @Public()
    @Get('refresh')
    @ApiResponse({ type: LoginResponseDto })
    @Serialize(LoginResponseDto)
    refreshToken(@Headers('Authorization') authorizationHeader: string) {
        const token = authorizationHeader.split(' ')[1];
        return this.authService.refreshToken(token);
    }
}
                                                                                                                                        