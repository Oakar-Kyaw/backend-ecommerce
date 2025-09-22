import { ConflictException, Injectable, NotFoundException, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { CreateUserWithProfileDto } from '../dto/create-user.dto';
import { UpdateUserWithProfileDto } from '../dto/update-user.dto';
import { hashedPassword } from '../../../libs/utils/hash';
import { Role } from '@prisma/client';
import { UserPrismaService } from 'apps/prisma/prisma.service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: UserPrismaService,
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
    return {
      success: true,
      message: "CREATED_USER",
      data: user
   }
  }

 async findAll(filters: { email?: string; phone?: string, role?: Role }) {
  const { email, phone, role  } = filters
  const filterRole: Role | null = role?.toUpperCase() as Role
  console.log("emila",email, phone)
  const users = await this.prisma.user.findMany({
    where: { isDeleted: false, ...(email && {email: email}), ...(phone && { phone: phone }), ...(filterRole && { role: filterRole }) },
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
      where: { id }
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

    return {
      success: true,
      message: "DELETE_USER_BY_ID",
      data: deletedUser
    };
  });
 }

 async findUserByEmail(data: {email: string}) {
    const { email } = data
    console.log("email", email)
    const user = await this.prisma.user.findUnique({
      where: {  email, isDeleted: false }
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return {
      success: true,
      message: 'USER_BY_EMAIL',
      data: user,
    };
  }

}
