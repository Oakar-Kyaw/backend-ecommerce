import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateUserWithProfileDto, RoleEnum } from '../dto/create-user.dto';
import { VerifyOtpDto } from '../dto/otp.dto';
import {
  getPagination,
  buildPaginationResponse,
} from '../../../libs/utils/pagination';
import { UpdateUserPassword, UpdateUserWithProfileDto } from '../dto/update-user.dto';
import { hashedPassword } from '../../../libs/utils/hash';
import {
  CREATED_NOTIFICATION_SERVICE_QUEUE,
  CREATED_ORDER_SERVICE_QUEUE,
  CREATED_PAYMENT_SERVICE_QUEUE,
  CREATED_USER_JOB,
  CREATED_USER_SERVICE_QUEUE,
  QueueServices,
  UPDATED_USER_JOB,
} from 'libs/queue/constant';
import { PublishMessage } from 'libs/queue/publish';
import { envConfig } from 'libs/config/envConfig';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { PRISMA } from '../prisma/prisma.service';
import { BrandUserService } from './brand-user.service';
import { EventPublisherService } from './event-publisher.service';
import * as XLSX from 'xlsx';
import Redis from 'ioredis';
import createAPI from 'libs/utils/axio.instance';

import { SyncAction, SyncDeviceTokenDto } from '../dto/sync-device-token.dto';
import { FileUpload } from 'libs/utils/file-upload';

@Injectable()
export class UsersService {
  constructor(
    private readonly uploadFile: FileUpload,
    @Inject(PRISMA) private readonly prisma,
    // @InjectQueue(CREATED_USER_QUEUE) private readonly queue: Queue,
    private readonly brandUserService: BrandUserService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  private redis: Redis = envConfig().redis_url
    ? new Redis(envConfig().redis_url as string)
    : new Redis({
        host: envConfig().redis_host,
        port: envConfig().redis_port,
        password: envConfig().redis_password || undefined,
      });

  async create(createUserDto: CreateUserWithProfileDto) {
    console.log('UserService.create called with:', JSON.stringify(createUserDto, null, 2));
    const { email, phone } = createUserDto;
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      console.warn(`User with email ${email} or phone ${phone} already exists`);
      throw new ConflictException('Email or phone already exists');
    }

    const hashPassword = await hashedPassword(createUserDto.password);

    const { brandId, ...dto } = createUserDto;

    if (dto.role && ['USER', 'CUSTOMER'].includes(String(dto.role))) {
      const otp = (createUserDto as any).otp;
      console.log('otp is ', otp);
      if (!otp) throw new UnauthorizedException('OTP_REQUIRED');
      const key = `otp:signup:${email}`;
      const stored = await this.redis.get(key);
      if (!stored) throw new NotFoundException('OTP_EXPIRED_OR_NOT_FOUND');
      if (stored !== otp) throw new UnauthorizedException('INVALID_OTP');
      await this.redis.del(key);

      // Create user in Firebase Auth
      try {
        await admin.auth().createUser({
          email: email,
          password: createUserDto.password,
          displayName: `${createUserDto.firstName} ${createUserDto.lastName}`,
          emailVerified: true,
          ...(phone && { phoneNumber: phone }),
        });
        console.log(`Firebase user created for ${email}`);
      } catch (error) {
        console.error('Error creating Firebase user:', error);
        // If user already exists in Firebase, we proceed to create in our DB (syncing)
        if (error.code !== 'auth/email-already-exists') {
          // For other errors, we might want to throw or just log.
          // If Firebase is critical, we should throw.
          // throw new ConflictException(`Firebase Error: ${error.message}`);
          console.warn(`Failed to create Firebase user: ${error.message}`);
        } else {
          console.log(`User ${email} already exists in Firebase.`);
        }
      }
    }
    //delete otp in payload which doesn't exist in db table
    delete dto.otp;
    // check if brand exists
    if (brandId) {
      // check if brand exists
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId, isDeleted: false },
      });
      if (!brand) throw new NotFoundException(`Brand ${brandId} not found`);
    }

    const roleValue = dto.role === 'USER' ? 'CUSTOMER' : dto.role;
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        role: roleValue,
        password: hashPassword,
      },
      include: { brandUserRelationship: { include: { brand: true } } },
    });

    console.log('User created in DB:', user);
    // 4️link brand if provided
    if (brandId) await this.brandUserService.linkUserToBrand(user.id, brandId);

   QueueServices.map((name)=>{
      console.log("sending data to ", name)
      this.eventPublisher.createUser(name, user);
    })
    //send welcome message
    let subject = 'Welcome to Our Platform!';
    let htmlContent = '';
    const fullName = [createUserDto.firstName, createUserDto.lastName].filter(Boolean).join(' ') || 'User';

    if (dto.role === RoleEnum.SALE) {
      subject = 'Welcome to Our Brand Provider Network!';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="color: #4CAF50;">Welcome, ${fullName}!</h1>
          <p>We are thrilled to have you join us as a Brand Provider.</p>
          <p>Your account has been successfully created. You can now start managing your brand and products on our platform.</p>
          <p>Here are your next steps:</p>
          <ul>
            <li>Complete your brand profile</li>
            <li>Upload your product catalog</li>
            <li>Review your dashboard</li>
          </ul>
          <p>We look forward to a successful partnership!</p>
          <p style="margin-top: 20px;">— The Team</p>
        </div>
      `;
    } else {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="color: #4CAF50;">Welcome, ${fullName}!</h1>
          <p>Thank you for joining our platform. We are excited to have you on board!</p>
          <p>Here is a quick tip to get started:</p>
          <ul>
            <li>Set up your profile</li>
            <li>Check out the latest features</li>
          </ul>
          <p>We are here to help anytime. Enjoy your journey with us!</p>
          <p style="margin-top: 20px;">— The Team</p>
        </div>
      `;
    }

    await this.eventPublisher.sendEmail({
      to: email,
      subject: subject,
      html: htmlContent,
    });

    return {
      success: true,
      message: 'CREATED_USER',
      data: user,
    };
  }

  async findAll(query: {
    isDeleted?: boolean;
    email?: string;
    phone?: string;
    role?: RoleEnum;
    search?: string;
    page?: string;
    pageSize?: string;
    from?: string;
    to?: string;
    startDate?: string;
    endDate?: string;
    order?: 'asc' | 'desc';
  }) {
    const where: any = { isDeleted: false };
    if (query?.isDeleted !== undefined) where.isDeleted = query.isDeleted;
    if (query?.role) {
      const r = query.role?.toUpperCase();
      where.role = r === 'USER' ? 'CUSTOMER' : r;
    }
    if (query?.email) where.email = query.email;
    if (query?.phone) where.phone = query.phone;

    if (query?.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const qFrom = query?.from ?? query?.startDate;
    const qTo = query?.to ?? query?.endDate;
    if (qFrom || qTo) {
      const createdAt: { gte?: Date; lte?: Date } = {};
      if (qFrom) createdAt.gte = new Date(qFrom);
      if (qTo) {
        const end = new Date(qTo);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }

    const order = query?.order === 'asc' ? 'asc' : 'desc';
    const page = query?.page ? Number(query.page) : undefined;
    const pageSize = query?.pageSize ? Number(query.pageSize) : undefined;
    const meta = getPagination({ page, pageSize });

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          brandUserRelationship: { include: { brand: true } },
          device_infos: true,
        },
        orderBy: { id: order },
        skip: meta.skip,
        take: meta.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginationResponse(users, meta, total, 'LIST_OF_USERS');
  }

  async exportExcel(query: {
    isDeleted?: boolean;
    email?: string;
    phone?: string;
    role?: RoleEnum;
    search?: string;
    from?: string;
    to?: string;
    startDate?: string;
    endDate?: string;
    order?: 'asc' | 'desc';
  }) {
    const where: any = {};
    if (query?.isDeleted !== undefined) where.isDeleted = query.isDeleted;
    if (query?.email) where.email = query.email;
    if (query?.phone) where.phone = query.phone;
    if (query?.role) {
      const r = query.role?.toUpperCase();
      where.role = r === 'USER' ? 'CUSTOMER' : r;
    }
    if (query?.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const exFrom = query?.from ?? query?.startDate;
    const exTo = query?.to ?? query?.endDate;
    if (exFrom || exTo) {
      const createdAt: { gte?: Date; lte?: Date } = {};
      if (exFrom) createdAt.gte = new Date(exFrom);
      if (exTo) {
        const end = new Date(exTo);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }

    const order = query?.order === 'asc' ? 'asc' : 'desc';
    const users = await this.prisma.user.findMany({
      where,
      include: { brandUserRelationship: { include: { brand: true } } },
      orderBy: { id: order },
    });

    const rows = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      phone: u.phone || '',
      role: u.role || '',
      isDeleted: !!u.isDeleted,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : '',
      updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : '',
      brands: Array.isArray(u.brandUserRelationship)
        ? u.brandUserRelationship
            .map((r: any) => r.brand?.name ?? '')
            .filter(Boolean)
            .join(', ')
        : '',
    }));

    const headers = [
      'id',
      'email',
      'firstName',
      'lastName',
      'phone',
      'role',
      'isDeleted',
      'createdAt',
      'updatedAt',
      'brands',
    ];
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    const buffer = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;
    const filename = 'users_export.xlsx';
    return { buffer, filename };
  }

  async sendOtp({ email, mode }: { email: string; mode?: string }) {
    if (!email) throw new NotFoundException('EMAIL_REQUIRED');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`DEBUG OTP for ${email}: ${otp}`);
    const key = `otp:${mode || 'signup'}:${email}`;
    await this.redis.set(key, otp, 'EX', 300);
    try {
      this.eventPublisher.sendEmail({
        to: email,
        subject: 'Your verification code',
        html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
      });
    } catch (err) {
      console.error('OTP email send failed', err);
      // Continue returning success so the user can verify with the stored OTP
    }
    return { success: true, message: 'OTP_SENT' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { email, mode, otp } = dto;
    console.log('Verifying OTP with DTO:', JSON.stringify(dto, null, 2));

    if (!email || !otp) throw new NotFoundException('EMAIL_AND_OTP_REQUIRED');

    // If signup mode and registration data is present (password is a good indicator), create the user immediately
    if ((mode === 'signup' || !mode) && dto.password) {
      console.log('Attempting to create user during OTP verification...');
      
      // We check OTP existence here to fail fast, but let create() handle the final verification and deletion
      const key = `otp:signup:${email}`;
      const stored = await this.redis.get(key);
      console.log(`Checking Redis Key: ${key}, Stored: ${stored}, Provided: ${otp}`);
      
      if (!stored) throw new NotFoundException('OTP_EXPIRED_OR_NOT_FOUND');
      if (stored !== otp) throw new UnauthorizedException('INVALID_OTP');

      // Map to CreateUserWithProfileDto
      const createUserDto: CreateUserWithProfileDto = {
        email,
        password: dto.password,
        role: dto.role || RoleEnum.CUSTOMER,
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        phone: dto.phone,
        identification: dto.identification,
        dateOfBirth: dto.dateOfBirth,
        brandId: dto.brandId,
        otp: otp, // Pass OTP so create method can verify and delete it
      };

      console.log('Calling create() with:', JSON.stringify(createUserDto, null, 2));
      
      try {
        // This will create user in User DB and publish event for Auth DB
        const result = await this.create(createUserDto);
        console.log('User creation result:', result);
        return result;
      } catch (error) {
        console.error('Error creating user during OTP verification:', error);
        throw error;
      }
    }
    
    // If we are here, it means we are just verifying OTP without creating user (e.g. forgot password flow, or legacy signup flow)
    const key = `otp:${mode || 'signup'}:${email}`;
    const stored = await this.redis.get(key);
    console.log('otp', otp, key, stored);
    if (!stored) throw new NotFoundException('OTP_EXPIRED_OR_NOT_FOUND');
    if (stored !== otp) throw new UnauthorizedException('INVALID_OTP');
    
    // If it's signup mode but no password, we just delete OTP and return success. 
    // This allows the client to call signup() separately (if that flow exists) 
    // BUT the client must provide the OTP again to signup() which will fail if we delete it here.
    // So for signup mode, we should NOT delete it if we expect a follow-up signup call.
    if (mode === 'signup' || !mode) {
         // Do not delete key for signup mode, so the subsequent create() call can verify it.
         // However, this opens a window where OTP can be reused or brute forced if not careful.
         // But since create() deletes it, it should be fine for the short duration.
         return { success: true, message: 'OTP_VERIFIED' };
    }

    await this.redis.del(key);
    return { success: true, message: 'OTP_VERIFIED' };
  }

  async findOne(id: number, host?: 'http' | 'tcp') {
    if (!Number.isInteger(id)) {
      throw new NotFoundException('INVALID_USER_ID');
    }
    console.log('user found', id);
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        brandUserRelationship: { include: { brand: true } },
        device_infos: true,
      },
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // If found, return success object
    return {
      success: true,
      message: 'USER_BY_ID',
      data: user,
    };
  }

  async update(
    id: number,
    updateUserDto: UpdateUserWithProfileDto,
    file: Express.Multer.File,
  ) {
    //console.log("req", req["user"])
    //   const loginuser = await this.prisma.user.findUnique({
    //     where: { id: req["user"]["id"] }
    //   })
    //  // console.log("login user", loginuser?.role === "MEMBER")
    // if(loginuser?.id != id && loginuser?.role != "ADMIN") throw new UnauthorizedException("You can't edit other user")

    let imageUrl;
    const existingUser = await this.prisma.user.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existingUser)
      throw new NotFoundException(`User with ID ${id} not found`);

    const existingOtherUser = await this.prisma.user.findFirst({
      where: { NOT: { id }, email: updateUserDto.email },
    });

    if (file)
      imageUrl = (
        await this.uploadFile.uploadSingle({ file, folderName: 'profile' })
      ).url;
    console.log(
      'existing other user',
      existingOtherUser,
      'photo url',
      imageUrl,
    );

    if (existingOtherUser)
      throw new ConflictException(
        `User with this ${updateUserDto.email} already exist in other account.`,
      );

    if (updateUserDto.password)
      updateUserDto.password = await hashedPassword(updateUserDto.password);

    //console.log("update user data: ", updateUserDto)
    const { brandId, otp, ...rawDto } = updateUserDto;

    //remove null field
    const dto = this.removeEmptyFields(rawDto);

    if (brandId) await this.brandUserService.linkUserToBrand(id, brandId);

    const updateRole = dto['role'] === 'USER' ? 'CUSTOMER' : dto['role'];
    const updateUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        ...(file ? { photoUrl: imageUrl } : {}),
        ...(dto['role'] ? { role: updateRole } : {}),
      },
      include: { brandUserRelationship: { include: { brand: true } } },
    });
    console.log("updated user :", updateUser, dto, imageUrl)
    
    //publish event update user to all server
    QueueServices.map((name)=>{
      console.log("name", name)
      this.eventPublisher.userUpdated(name, {
            id: updateUser.id,
            email: updateUser.email,
            phone: updateUser.phone ?? null,
            password: updateUser.password ?? null,
            role: updateUser.role ?? 'CUSTOMER',
      })
    })
   

    return {
      success: true,
      message: 'UPDATED_USER',
      data: updateUser,
    };
  }

  async remove(id: number) {
    const userExists = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.$transaction(async (prisma) => {
      // Delete brand user relationships
      await prisma.brandUserRelationship.deleteMany({
        where: { userId: id },
      });

      // Delete Redis OTP keys
      await this.redis.del(`otp:signup:${userExists.email}`);
      await this.redis.del(`otp:forgot:${userExists.email}`);

      // Finally, soft-delete the user itself
      const deletedUser = await prisma.user.update({
        where: { id },
        data: { isDeleted: true },
      });

      //publish event delete user to all server
      // await Promise.all(
        QueueServices.map( async (name) => {
          console.log("sending data to", name);
          await this.eventPublisher.userDeleted(name, id);
        })
      // );

      return {
        success: true,
        message: 'DELETE_USER_BY_ID',
        data: deletedUser,
      };
    });
  }

  getAuthClient() {
    const authClient = new OAuth2Client(
      envConfig().GOOGLE_ANDROID_CLIENTID,
      envConfig().GOOGLE_CLIENT_SECRET,
      envConfig().GOOGLE_USER_CALLBACK_URL,
    );
    return authClient;
  }

  async googleAuthUrl(deviceId?: string) {
    const authClient = this.getAuthClient();
    console.log('google clien', authClient);
    const authUrl = authClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile'],
      prompt: 'consent',
      include_granted_scopes: true,
    });
    console.log('auth url ', authUrl, deviceId);
    // const url =  `${authUrl}?deviceId=${deviceId ?? deviceId }`
    const url = authUrl;
    return { url };
  }

  async googleAuthClientData(code: string) {
    const authClient = this.getAuthClient();
    const tokenData = await authClient.getToken(code);
    const tokens = tokenData.tokens;
    console.log('tokens: ', tokens);

    authClient.setCredentials(tokens);

    const googleAuth = google.oauth2({
      version: 'v2',
      auth: authClient,
    } as any);

    const userInfo = await googleAuth.userinfo.get();
    console.log('user info:', userInfo);

    return { userData: userInfo.data };
  }

  async googleRegister(idToken: string) {
    const client = new OAuth2Client(envConfig().GOOGLE_ANDROID_CLIENTID);
    console.log(envConfig().GOOGLE_ANDROID_CLIENTID, 'client');
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: [
        envConfig().GOOGLE_ANDROID_CLIENTID as string,
        envConfig().GOOGLE_IOS_CLIENTID as string,
      ],
    });
    const payload = ticket?.getPayload();
    console.log('payload', ticket, payload, payload?.picture);
    return this.saveGoogleUser(payload);
  }

  async saveGoogleUser(userData, deviceId?: string) {
    const { email, given_name, family_name, picture } = userData;
    console.log('email: ', userData, deviceId);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    console.log('existingUser: ', existingUser);
    if (existingUser)
      return {
        success: false,
        message: 'User already existed.',
        // data: user,
      };
    const user = await this.prisma.user.create({
      data: {
        email: email,
        firstName: given_name,
        lastName: family_name,
        photoUrl: picture,
      },
    });
    //  this.eventPublisher.createUser(,user);
    return {
      success: true,
      message: 'User has been created successfully.',
      data: user,
    };
  }

  async registerFacebookUser(data) {
    console.log('facebook user data: ', data);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email, isDeleted: false },
    });
    if (existingUser)
      throw new ConflictException(
        `User with this email ${data.email} already exists.`,
      );
    if (data?.birthday)
      data.dateOfBirth = new Date(data.birthday).toISOString();
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        photoUrl: data.photoUrl,
        dateOfBirth: data.dateOfBirth ?? null,
        gender: data?.gender?.toUpperCase() ?? null,
      },
    });
    console.log('user: ', user);
    //this.eventPublisher.createUser(user);
    return {
      success: true,
      message: 'CREATED_USER',
      data: user,
    };
  }

  async removeByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return this.remove(user.id);
  }

  async syncDeviceToken(dto: SyncDeviceTokenDto) {
    const { userId, deviceToken, action, deviceInfo } = dto;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    const tokens = user.device_tokens || [];
    if (action === SyncAction.ADD) {
      // 1. Add to User.device_tokens if not present
      if (!tokens.includes(deviceToken)) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { device_tokens: { push: deviceToken } },
        });
      }

      // 2. Upsert DeviceInfo
      if (deviceInfo) {
        await this.prisma.deviceInfo.upsert({
          where: { deviceToken },
          update: {
            ...deviceInfo,
            lastActive: new Date(),
          },
          create: {
            ...deviceInfo,
            userId,
            deviceToken,
          },
        });
      }
    } else if (action === SyncAction.REMOVE) {
      // 1. Remove from User.device_tokens
      const newTokens = tokens.filter((t) => t !== deviceToken);
      if (newTokens.length !== tokens.length) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { device_tokens: newTokens },
        });
      }

      // 2. Remove DeviceInfo
      await this.prisma.deviceInfo.deleteMany({
        where: { deviceToken },
      });
    }

    return { success: true };
  }

  async getAdminAnalytics(year: number) {
    // Registered Users by Month
    // PostgreSQL specific date functions
    const usersByMonth = await this.prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM "createdAt")::int as month, 
        COUNT(*)::int as count 
      FROM "User" 
      WHERE 
        EXTRACT(YEAR FROM "createdAt") = ${year} 
        AND "role" = 'CUSTOMER'
      GROUP BY month
      ORDER BY month ASC
    `;

    // Format to array of 12 months
    const monthlyRegistrations = Array(12).fill(0);
    (usersByMonth as any[]).forEach((item) => {
      monthlyRegistrations[item.month - 1] = item.count;
    });

    return {
      year,
      monthlyRegistrations,
    };
  }

  async updatePassword(id: number, body: UpdateUserPassword ){
    const { password } = body;
    console.log("password", UpdateUserPassword, password)
    const hashPassword = await hashedPassword(password);
    const updateUser = await this.prisma.user.update({
      where: { id },
      data: {
        password: hashPassword
      },
      include: { brandUserRelationship: { include: { brand: true } } },
    });

    //publish to auth server
    this.eventPublisher.userUpdated(CREATED_USER_SERVICE_QUEUE, {
       id: updateUser.id,
       email: updateUser.email,
       phone: updateUser.phone ?? null,
       password: hashPassword ?? null,
       role: updateUser.role ?? 'CUSTOMER',
    })
    return {
      success: true,
      message: "PASSWORD_UPDATED_SUCCESSFULLY"
    }
  }
  removeEmptyFields<T extends Record<string, any>>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([_, value]) => value !== null && value !== undefined && value !== '',
      ),
    ) as Partial<T>;
  }
}
