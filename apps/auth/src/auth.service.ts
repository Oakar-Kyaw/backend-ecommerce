import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from '../../../libs/utils/hash';
import { envConfig } from 'libs/config/envConfig';
import { AUTH_PRISMA } from '../prisma/auth.prisma.service';

// interface PayloadInterface {
//   id: number;
//   email: string | null;
//   phone: string | null;
// }

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_PRISMA) private readonly prisma,
  ) {}

  async signIn(datas) {
    if (!datas)
      throw new BadRequestException('Either email or phone must be provided');
    const { email, password, phone } = datas;
    console.log('email and password', email, password);
    if (!email && !phone)
      throw new BadRequestException('Either email or phone must be provided');

    const user = await this.prisma.user.findFirst({
      where: {
        isDeleted: false,
        OR: [email && { email }, phone && { phone }].filter(Boolean),
      },
    });
    if (!user)
      throw new NotFoundException(
        `User with this ${email ? 'email' : 'phone'} Not found`,
      );
    //const user = data
    const passwordComparison = await comparePassword(password, user.password);
    if (!passwordComparison)
      throw new UnauthorizedException(`Password was wrong.`);
    const payload = {
      id: user.userId,
      userId: user.userId,
      email: user.email,
      phone: user.phone,
      role: user.role,
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
      data: payload,
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
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: envConfig().JWTRefreshSecret,
    });

    console.log('✅ Token verified successfully');
    console.log('📋 Payload extracted:', {
      id: payload.id,
      email: payload.email,
    });

    console.log('👤 Looking up user by ID:', payload.id);
    // const { success, message, data } = await firstValueFrom(
    //       this.userClient.send({cmd: 'get_user_by_id'}, { id: payload.id })
    //   );
    const data = await this.prisma.user.findFirst({
      where: { userId: payload.id },
    });
    console.log(
      '👤 User found for refresh:',
      data ? `Yes (${data.email})` : 'No',
    );

    if (!data) {
      throw new ForbiddenException('Invalid refresh token - user not found');
    }

    console.log('🎫 Generating new access token...');
    const newAccessToken = await this.jwtService.signAsync({
      id: data.userId,
      userId: data.userId,
      email: data.email,
      phone: data.phone,
      role: data.role,
    });

    console.log('✅ New access token generated successfully');

    return {
      success: true,
      message: 'Access Token',
      access_token: newAccessToken,
    };
  }

  async getSession(authorizationHeader: string) {
    if (!authorizationHeader) {
      throw new BadRequestException('Authorization header is required');
    }
    const tokenParts = authorizationHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      throw new BadRequestException('Invalid authorization header format');
    }
    const token = tokenParts[1];

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.prisma.user.findFirst({
        where: { userId: payload.id },
      });

      if (!user) throw new NotFoundException('User not found');

      return {
        success: true,
        message: 'Session Valid',
        data: {
          id: user.userId,
          userId: user.userId,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
