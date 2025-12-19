import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { comparePassword, hashedPassword } from '../../../libs/utils/hash';
import { envConfig } from 'libs/config/envConfig';
import { AUTH_PRISMA } from '../prisma/auth.prisma.service';
import axios from 'axios';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { GoogleLoginDto } from '../dto/google-login.dto';

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

  async googleLogin(dto: GoogleLoginDto) {
    const { idToken, deviceToken, deviceInfo } = dto;

    // 1. Verify ID Token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Google ID Token Verification Error:', error.message);
      throw new UnauthorizedException('Invalid Firebase ID Token');
    }

    const { email, name, picture, uid } = decodedToken;
    if (!email) {
      throw new BadRequestException('Email not found in Google Token');
    }

    // 2. Check if user exists in Auth DB
    let user = await this.prisma.user.findFirst({
      where: { email, isDeleted: false },
    });

    if (!user) {
      console.log(`User ${email} not found in Auth DB. Creating...`);
      // 3. User not found in Auth DB, create in User Service
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const [firstName, ...lastNameParts] = (name || 'Google User').split(' ');
      const lastName = lastNameParts.join(' ') || '';

      let userId: number;
      let userRole = 'CUSTOMER';

      try {
        const createUserPayload = {
          email,
          firstName,
          lastName,
          password: randomPassword,
          role: 'CUSTOMER',
          photoUrl: picture,
          identification: '', // Optional
          phone: '', // Optional
        };

        const userServiceUrl = envConfig().user_service_url;
        console.log(`Creating user in User Service at ${userServiceUrl}/users`);
        
        const response = await axios.post(`${userServiceUrl}/users`, createUserPayload);
        
        // Handle response structure. It might be { data: user } or just user.
        // Based on typical NestJS response with interceptors, it's often nested.
        const createdUser = response.data.data || response.data;
        
        if (!createdUser || !createdUser.id) {
            console.error('Invalid response from User Service:', JSON.stringify(response.data));
            throw new InternalServerErrorException('Invalid response from User Service');
        }

        userId = createdUser.id;
        // userRole = createdUser.role || 'CUSTOMER'; // User Service response might not include role in some DTOs
        
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`User ${email} already exists in User Service. Fetching details...`);
          // User already exists in User Service. Fetch details.
          try {
             const userServiceUrl = envConfig().user_service_url;
             // Search by email
             const searchResponse = await axios.get(`${userServiceUrl}/users`, {
               params: { search: email }
             });
             
             const usersData = searchResponse.data.data || searchResponse.data;
             // Ensure it's an array
             const users = Array.isArray(usersData) ? usersData : [];
             
             const existingUser = users.find((u: any) => u.email === email);
             if (!existingUser) {
               throw new InternalServerErrorException('User exists but cannot be found via search');
             }
             userId = existingUser.id;
             userRole = existingUser.role;
          } catch (findErr) {
             console.error('Error finding existing user:', findErr.message);
             throw new InternalServerErrorException('Failed to retrieve existing user from User Service');
          }
        } else {
          console.error('Error creating user in User Service:', error.message);
           if (error.response) {
              console.error('Response data:', JSON.stringify(error.response.data));
           }
          throw new InternalServerErrorException('Failed to create user in User Service');
        }
      }

      // Create in Auth DB
      // We store hashed password if we created it, else null.
      // But actually, we can just store null for Google users in Auth DB.
      // They can set a password later if they want to use email/password login.
      
      const hashedPasswordStr = await hashedPassword(randomPassword);

      user = await this.prisma.user.create({
        data: {
          email,
          userId,
          role: userRole as any,
          password: hashedPasswordStr, 
          device_tokens: [],
        },
      });
      console.log(`User created in Auth DB with ID: ${user.id}`);
    }

    // 4. Handle Device Token
    if (deviceToken) {
      const tokens = user.device_tokens || [];
      if (!tokens.includes(deviceToken)) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { device_tokens: { push: deviceToken } },
        });
      }

      // Sync with User Service
      try {
        await axios.post(
          `${envConfig().user_service_url}/users/device-token`,
          {
            userId: user.userId,
            deviceToken: deviceToken,
            action: 'add',
            deviceInfo: deviceInfo,
          },
        );
      } catch (e) {
        console.error('Failed to sync device token with User Service', e.message);
      }
    }

    // 5. Generate Tokens
    const payload = {
      id: user.userId,
      userId: user.userId,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    console.log('🎫 Generating tokens for Google user:', user.id);
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

    // Handle Device Token
    if (datas.deviceToken) {
      const tokens = user.device_tokens || [];
      if (!tokens.includes(datas.deviceToken)) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { device_tokens: { push: datas.deviceToken } },
        });
      }

      // Sync with User Service (Always sync to ensure consistency and update device info)
      try {
        await axios.post(
          `${envConfig().user_service_url}/users/device-token`,
          {
            userId: user.userId,
            deviceToken: datas.deviceToken,
            action: 'add',
            deviceInfo: datas.deviceInfo,
          },
        );
      } catch (e) {
        console.error(
          'Failed to sync device token with User Service',
          e.message,
        );
      }
    }

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

  async signOut(authorizationHeader: string, deviceToken?: string) {
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

    if (deviceToken) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: envConfig().JWTSecret,
        });
        const user = await this.prisma.user.findUnique({
          where: { userId: payload.userId },
        });

        if (user) {
          const tokens = user.device_tokens || [];
          const newTokens = tokens.filter((t) => t !== deviceToken);

          if (newTokens.length !== tokens.length) {
            await this.prisma.user.update({
              where: { id: user.id },
              data: { device_tokens: newTokens },
            });
          }

          // Sync with User Service (Always attempt removal)
          try {
            await axios.post(
              `http://localhost:${envConfig().user_service_port}/api/v1/users/device-token`,
              {
                userId: user.userId,
                deviceToken,
                action: 'remove',
              },
            );
          } catch (e) {
            console.error('Failed to sync device token removal', e.message);
          }
        }
      } catch (e) {
        console.error('Error removing device token on logout:', e);
      }
    }

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
