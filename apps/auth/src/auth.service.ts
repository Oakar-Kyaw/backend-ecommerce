import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
//import { PrismaService } from '../../../shared/prisma/prisma.service';
import { comparePassword } from '../../../libs/utils/hash';
import createAPI from 'libs/utils/axio.instance';
import { envConfig } from 'libs/config/envConfig';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

interface PayloadInterface {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService, @Inject('USER') private readonly userClient: ClientProxy) {}
    
    async signIn(datas) {
        if( !datas ) throw new BadRequestException('Either email or phone must be provided');
        const { email, password, phone } = datas
        console.log("email and password", email, password)
        if( (!email && !phone)) throw new BadRequestException('Either email or phone must be provided')
        const { success, message, data, error } = await firstValueFrom(
            this.userClient.send({cmd: 'users'}, { email, phone })
        );
        if(!success && message) {
          console.log("message", message, "success")
          throw new NotFoundException(`User with this ${email ? 'email' : 'phone'} Not found`)  
        }
        
        const user = data
        const passwordComparison = await comparePassword(password, user.password)
        if(!passwordComparison) throw new UnauthorizedException(`Password was wrong.`)
        const payload: PayloadInterface = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone
      };

      console.log('🎫 Generating tokens for user:', user.id);
      const access_token = await this.jwtService.signAsync(payload);
        const refresh_token = await this.jwtService.signAsync(payload, {
            secret: envConfig().JWTRefreshSecret,
            expiresIn: '7d',
        });
        return {
            success: true,
            message: 'Login Successful',
            data: user,
            access_token,
            refresh_token,
        };
    }

    async signOut(authorizationHeader: string) {
      console.log('🚪 Starting logout process');
      console.log(
        '🎫 Authorization header received:',
        authorizationHeader ? 'Yes' : 'No',
      );

      if (!authorizationHeader) {
        throw new BadRequestException('Authorization header is required');
      }

      const tokenParts = authorizationHeader.split(' ');
      if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        throw new BadRequestException(
          'Invalid authorization header format. Expected: Bearer <token>',
        );
      }

      const token = tokenParts[1];

      if (!token) {
        throw new BadRequestException(
          'Token is missing from authorization header',
        );
      }

      console.log('🎫 Token extracted, adding to blacklist...');

    //   await this.prisma.blacklistToken.create({
    //     data: { token: token },
    //   });

      console.log('✅ Token blacklisted successfully');

      return {
        success: true,
        message: 'Logout Successfully',
      }; 
  }

  async refreshToken(refreshToken: string) {

      console.log('🔄 Starting token refresh process');
      console.log('🎫 Refresh token received:', refreshToken ? 'Yes' : 'No');

      if (!refreshToken) {
        throw new ForbiddenException('Refresh token is required');
      }

      console.log('🔍 Verifying refresh token...');
      const payload = await this.jwtService.verifyAsync(
        refreshToken,
        {
          secret: envConfig().JWTRefreshSecret,
        },
      );

      console.log('✅ Token verified successfully');
      console.log('📋 Payload extracted:', {
        id: payload.id,
        name: payload.name,
      });

      console.log('👤 Looking up user by ID:', payload.id);
      const { success, message, data } = await firstValueFrom(
            this.userClient.send({cmd: 'get_user_by_id'}, { id: payload.id })
        );

      console.log(
        '👤 User found for refresh:',
        data ? `Yes (${data.name})` : 'No',
      );

      if (!data) {
        throw new ForbiddenException('Invalid refresh token - user not found');
      }

      console.log('🎫 Generating new access token...');
      const newAccessToken = await this.jwtService.signAsync({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
      });

      console.log('✅ New access token generated successfully');

      return {
        success: true,
        message: 'Access Token',
        access_token: newAccessToken,
      };
  }
}
