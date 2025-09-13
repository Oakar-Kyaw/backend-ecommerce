import { ConflictException, Injectable, NotFoundException, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { CreateUserWithProfileDto } from '../dto/create-user.dto';
import { UpdateUserWithProfileDto } from '../dto/update-user.dto';
import { hashedPassword } from '../../../libs/utils/hash';
import { PrismaService } from '../schema/prisma/prisma.serverice';
import { Prisma } from '../schema/generated/prisma';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(createUserDto: CreateUserWithProfileDto) {
    const { bio, interest, dateOfBirth, salary, ...data } = createUserDto
     // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashPassword = await hashedPassword(createUserDto.password);
    const userData: Prisma.UserCreateInput = { ...data, password: hashPassword}
    if(createUserDto.role === "CUSTOMER"){
       userData.customerProfile = {
         create: {
            dateOfBirth: dateOfBirth ??  null,
            interest: interest ?? null
         }
       }
    }
    if(createUserDto.role === "SALE") {
        userData.saleProfile = {
          create: {
             bio: bio ?? null,
             salary: salary ?? null
          }
        }
    }
    console.log("userData", userData)
    const user = await this.prisma.user.create({
      data: userData,
      include: {
        customerProfile: true,
        saleProfile: true,

      },
    });
    return {
      success: true,
      message: "CREATED_USER",
      data: user
   }
  }

 async findAll(filters: { email?: string; phone?: string }) {
  const { email, phone  } = filters
  console.log("emila",email, phone)
  const users = await this.prisma.user.findMany({
    where: { isDeleted: false, ...(email && {email: email}), ...(phone && { phone: phone }) },
    orderBy: {
      id: "asc"
    },
    include: {
      customerProfile: true,
      saleProfile: true
    },
  });
    return {
      success: true,
      message: 'LIST_OF_ALL_USERS',
      data: users,
    };
  }

  async findOne(id: number | undefined) {
    console.log("user found", id )
    const user = await this.prisma.user.findUnique({
      where: { id , isDeleted: false },
      include: {
        customerProfile: true,
        saleProfile: true
      }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
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
      
    const userExists = await this.prisma.user.findUnique({
      where: { id },
      include: { customerProfile: true, saleProfile: true },
    }); 

    if (!userExists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedData: any = { ...updateUserDto };

    if (updateUserDto.password) {
      updatedData.password = await hashedPassword(updateUserDto.password);
    }

    // Remove nested profile fields from main object to avoid Prisma errors
    delete updatedData.bio;
    delete updatedData.dateOfBirth;
    delete updatedData.interest;
    delete updatedData.salary;

    if (updateUserDto.role?.toUpperCase() === 'SALE') {
      updatedData.saleProfile = {
        upsert: {
          create: {
            bio: updateUserDto?.bio || null,
            salary: updateUserDto?.salary || 0
          },
          update: {
            bio: updateUserDto?.bio || null,
            salary: updateUserDto?.salary || 0
          },
        },
      };

      // If previously was member, optionally delete memberProfile or keep it?

    } else if (updateUserDto.role?.toUpperCase() === 'CUSTOMER') {
      updatedData.memberProfile = {
        upsert: {
          create: {
            dateOfBirth: updateUserDto?.dateOfBirth || null,
            interest: updateUserDto?.interest || null
          },
          update: {
            dateOfBirth: updateUserDto?.dateOfBirth || null,
            interest: updateUserDto?.interest || null
          },
        },
      };
    }

    const updateUser = await this.prisma.user.update({
      where: { id },
      data: updatedData,
      include: {
        customerProfile: true,
        saleProfile: true,
      },
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
    // Soft-delete related MemberProfile
    await prisma.customerProfile.updateMany({
      where: { userId: id, isDeleted: false },
      data: { isDeleted: true },
    });

    // Soft-delete related TrainerProfile
    await prisma.saleProfile.updateMany({
      where: { userId: id, isDeleted: false },
      data: { isDeleted: true },
    });

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
      where: {  email, isDeleted: false },
      include: {
        customerProfile: true,
        saleProfile: true
      }
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
