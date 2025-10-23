import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { CreateUserWithProfileDto, RoleEnum } from '../dto/create-user.dto';
import { UpdateUserWithProfileDto } from '../dto/update-user.dto';
import { hashedPassword } from '../../../libs/utils/hash';
import { CREATED_USER_JOB, CREATED_USER_QUEUE, UPDATED_USER_JOB } from 'libs/queue/constant';
import { PublishMessage } from 'libs/queue/publish';
import { envConfig } from 'libs/config/envConfig';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { USER_PRISMA } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_PRISMA) private readonly prisma,
   // @InjectQueue(CREATED_USER_QUEUE) private readonly queue: Queue,
    private readonly publishMessage: PublishMessage
  ) {}

  async create(createUserDto: CreateUserWithProfileDto) {
    const { email, phone } = createUserDto
     // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or phone already exists');
    }

    const hashPassword = await hashedPassword(createUserDto.password);
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashPassword
      }
    })
    console.log("user: ",user)
    
    this.publishMessage.publish(
      CREATED_USER_QUEUE,
      CREATED_USER_JOB, 
      {
      userId: Number(user.id),
      email: user.email,
      phone: user.phone,
      password: user.password
    });
  
    return {
      success: true,
      message: "CREATED_USER",
      data: user
   }
  }

 async findAll(query: { isDeleted?: boolean, email?: string; phone?: string, role?: RoleEnum, startDate?: Date, endDate?: Date }) {
      const where: { isDeleted: boolean, role?: RoleEnum, createdAt?: { gte?: Date, lte?: Date }, email?: string, phone?: string } = { isDeleted: false };
      if (query?.isDeleted) {
        where.isDeleted = query.isDeleted;
      }
      
      if (query?.role) {
        const role = query.role.toUpperCase() as RoleEnum;
        where.role = role;
      }
      if (query?.email) {
        where.email = query.email;
      }
      if (query?.phone) {
        where.phone = query.phone;
      }
      //query with date
      if (query?.startDate || query?.endDate) {
        const createdAt: { gte?: Date, lte?: Date } = {};

        if (query.startDate) {
          createdAt.gte = new Date(query.startDate);
        }

        if (query.endDate) {
          const end = new Date(query.endDate);
          end.setHours(23, 59, 59, 999); // include full end day
          createdAt.lte = end;
        }

        where.createdAt = createdAt;
      }
      console.log('where', where);
  const users = await this.prisma.user.findMany({
    where,
    orderBy: {
      id: "asc"
    }
  });
    return {
      success: true,
      message: 'LIST_OF_ALL_USERS',
      data: users,
    };
  }

  async findOne(id: number, host?: 'http' | 'tcp') {
    console.log("user found", id);

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      // TCP: return structured object
      if (host === 'tcp') {
        return { success: false, error: [`User with ID ${id} does not exist`], data: null };
      }

      // HTTP: throw proper exception
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // If found, return success object
    return {
      success: true,
      message: 'USER_BY_ID',
      data: user,
    };
 }

  async update(id: number, updateUserDto: UpdateUserWithProfileDto, req: Request) {
         //console.log("req", req["user"])
      //   const loginuser = await this.prisma.user.findUnique({
      //     where: { id: req["user"]["id"] }
      //   })
      //  // console.log("login user", loginuser?.role === "MEMBER")
      // if(loginuser?.id != id && loginuser?.role != "ADMIN") throw new UnauthorizedException("You can't edit other user")
      
    const existingUser = await this.prisma.user.findUnique({
      where: { id,  isDeleted: false }
    }); 

    if (!existingUser) throw new NotFoundException(`User with ID ${id} not found`)

    const existingOtherUser = await this.prisma.user.findFirst({
      where: { NOT: { id }, email: updateUserDto.email}
    })

    console.log("existing other user", existingOtherUser)

    if(existingOtherUser) throw new ConflictException(`User with this ${updateUserDto.email} already exist in other account.`)

    if (updateUserDto.password) updateUserDto.password = await hashedPassword(updateUserDto.password);
    
    //console.log("update user data: ", updateUserDto)

    const updateUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto
      }
    })

    this.publishMessage.publish(
      CREATED_USER_QUEUE,
      UPDATED_USER_JOB, 
      {
      userId: Number(updateUser.id),
      email: updateUser.email,
      phone: updateUser.phone,
      password: updateUser.password
    });
    return {
      success: true,
      message: "UPDATED_USER",
      data: updateUser 
    }
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
    this.publishMessage.publish(
      CREATED_USER_QUEUE,
      UPDATED_USER_JOB, 
      {
      userId: Number(deletedUser.id),
      email: deletedUser.email,
      phone: deletedUser.phone,
      password: deletedUser.password
    });

    return {
      success: true,
      message: "DELETE_USER_BY_ID",
      data: deletedUser
    };
  });
 }

 getAuthClient(){
    const authClient = new OAuth2Client(
      envConfig().GOOGLE_CLIENTID,
      envConfig().GOOGLE_CLIENT_SECRET,
      envConfig().GOOGLE_USER_CALLBACK_URL
    )
    return authClient
  }

  async googleAuthUrl(deviceId?: string){
    const authClient = this.getAuthClient()
    console.log("google clien", authClient)
    const authUrl = authClient.generateAuthUrl({
      access_type: 'offline',
      scope:[ 'email', 'profile' ],
      prompt: 'consent',
      include_granted_scopes: true
    })
    console.log("auth url ", authUrl, deviceId)
   // const url =  `${authUrl}?deviceId=${deviceId ?? deviceId }`
   const url = authUrl
    return { url }
  }

  async googleAuthClientData(code: string){
    const authClient = this.getAuthClient()
    const tokenData = await authClient.getToken(code)
    const tokens = tokenData.tokens
    console.log("tokens: ", tokens)
    
    authClient.setCredentials(tokens)

    const googleAuth = google.oauth2({
      version: 'v2',
      auth: authClient,
    } as any);

    const userInfo = await googleAuth.userinfo.get()
    console.log("user info:", userInfo)
    
    return { userData: userInfo.data  };
  }

  async registerGoogleUser(userData, deviceId?: string){
    const { email, given_name, family_name, picture } = userData
    console.log("email: ", userData, deviceId )
    let existingUser = await this.prisma.user.findUnique({ where: { email } })
    console.log("existingUser: ", existingUser)
    if(existingUser) throw new ConflictException(`User with this email ${email} already exists.`)
    const user = await this.prisma.user.create({
      data: {
        email: email,
        firstName: given_name,
        lastName: family_name,
        photoUrl: picture
      }
    })
    this.publishMessage.publish(
      CREATED_USER_QUEUE,
      CREATED_USER_JOB, 
      {
      userId: Number(user.id),
      email: user.email,
      phone: user.phone ?? null,
      password: user.password ?? null
    });
    return {
        success: true,
        message: 'CREATED_USER',
        url: "myapp://auth/callback",
       // data: user,
      };
  }

  async registerFacebookUser(data){
    console.log("facebook user data: ", data)
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email, isDeleted: false } })
    if(existingUser) throw new ConflictException(`User with this email ${data.email} already exists.`)
    if(data?.birthday) data.dateOfBirth = new Date(data.birthday).toISOString()
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        photoUrl: data.photoUrl,
        dateOfBirth: data.dateOfBirth ?? null,
        gender: data?.gender?.toUpperCase() ?? null
      }
    })
    console.log("user: ", user)
    this.publishMessage.publish(
      CREATED_USER_QUEUE,
      CREATED_USER_JOB, 
      {
      userId: Number(user.id),
      email: user.email,
      phone: user.phone ?? null,
      password: user.password ?? null
    });
    return {
        success: true,
        message: 'CREATED_USER',
        data: user,
      };  
  }
}
