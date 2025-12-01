import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserWithProfileDto, RoleEnum } from '../dto/create-user.dto';
import {
  getPagination,
  buildPaginationResponse,
} from '../../../libs/utils/pagination';
import { UpdateUserWithProfileDto } from '../dto/update-user.dto';
import { hashedPassword } from '../../../libs/utils/hash';
import {
  CREATED_USER_JOB,
  CREATED_USER_QUEUE,
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

@Injectable()
export class UsersService {
  constructor(
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

  private emailApi = createAPI(
    `http://localhost:${envConfig().noti_service_port}/api/v1/email`,
  );

  async create(createUserDto: CreateUserWithProfileDto) {
    const { email, phone } = createUserDto;
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or phone already exists');
    }

    const hashPassword = await hashedPassword(createUserDto.password);

    const { brandId, ...dto } = createUserDto;

    if (dto.role && ['USER', 'CUSTOMER'].includes(String(dto.role))) {
      const otp = (createUserDto as any).otp;
      if (!otp) throw new UnauthorizedException('OTP_REQUIRED');
      const key = `otp:signup:${email}`;
      const stored = await this.redis.get(key);
      if (!stored) throw new NotFoundException('OTP_EXPIRED_OR_NOT_FOUND');
      if (stored !== otp) throw new UnauthorizedException('INVALID_OTP');
      await this.redis.del(key);
    }

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

    console.log('user: ', user);

    // 4️link brand if provided
    if (brandId) await this.brandUserService.linkUserToBrand(user.id, brandId);

    // 5️publish event
    this.eventPublisher.userCreated(user);

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
        include: { brandUserRelationship: { include: { brand: true } } },
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
    const key = `otp:${mode || 'signup'}:${email}`;
    await this.redis.set(key, otp, 'EX', 300);
    try {
      await this.emailApi.post('/send', {
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

  async verifyOtp({
    email,
    mode,
    otp,
  }: {
    email: string;
    mode?: string;
    otp: string;
  }) {
    if (!email || !otp) throw new NotFoundException('EMAIL_AND_OTP_REQUIRED');
    const key = `otp:${mode || 'signup'}:${email}`;
    const stored = await this.redis.get(key);
    if (!stored) throw new NotFoundException('OTP_EXPIRED_OR_NOT_FOUND');
    if (stored !== otp) throw new UnauthorizedException('INVALID_OTP');
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
      include: { brandUserRelationship: { include: { brand: true } } },
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
    req: Request,
  ) {
    //console.log("req", req["user"])
    //   const loginuser = await this.prisma.user.findUnique({
    //     where: { id: req["user"]["id"] }
    //   })
    //  // console.log("login user", loginuser?.role === "MEMBER")
    // if(loginuser?.id != id && loginuser?.role != "ADMIN") throw new UnauthorizedException("You can't edit other user")

    const existingUser = await this.prisma.user.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existingUser)
      throw new NotFoundException(`User with ID ${id} not found`);

    const existingOtherUser = await this.prisma.user.findFirst({
      where: { NOT: { id }, email: updateUserDto.email },
    });

    console.log('existing other user', existingOtherUser);

    if (existingOtherUser)
      throw new ConflictException(
        `User with this ${updateUserDto.email} already exist in other account.`,
      );

    if (updateUserDto.password)
      updateUserDto.password = await hashedPassword(updateUserDto.password);

    //console.log("update user data: ", updateUserDto)
    const { brandId, ...dto } = updateUserDto;
    if (brandId) await this.brandUserService.linkUserToBrand(id, brandId);

    const updateRole = dto['role'] === 'USER' ? 'CUSTOMER' : dto['role'];
    const updateUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        ...(dto['role'] ? { role: updateRole } : {}),
      },
      include: { brandUserRelationship: { include: { brand: true } } },
    });

    this.eventPublisher.userUpdated(updateUser);
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
      // Finally, soft-delete the user itself
      const deletedUser = await prisma.user.update({
        where: { id },
        data: { isDeleted: true },
      });
      this.eventPublisher.userUpdated(deletedUser);

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
    this.eventPublisher.userCreated(user);
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
    this.eventPublisher.userCreated(user);
    return {
      success: true,
      message: 'CREATED_USER',
      data: user,
    };
  }
}
