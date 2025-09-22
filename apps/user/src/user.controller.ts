import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserWithProfileDto } from '../dto/create-user.dto';
import { UpdateUserWithProfileDto } from '../dto/update-user.dto';
import { Public } from '../../../libs/decorator/public.decorators';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { Serialize } from '../../../libs/interceptor/response.interceptor';
import { CreatedUserResponseDto, DeletedUserResponseDto, UpdatedUserResponseDto, UserByIdResponseDto, UserListResponseDto, UserResponseDto } from '../dto/response-user.dto';
import { ExistedDataResponseDto, NotFoundResponseDto, ServerErrorResponseDto, UnauthorizeResponseDto } from '../../../libs/interceptor/error-response';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';

@ApiTags('Users')
@Controller('')
//@UseGuards(AuthGuard) // Apply AuthGuard to all routes by default
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Serialize(CreatedUserResponseDto)
  @UseInterceptors(FileInterceptor('photoUrl'))
  @Post()
  @ApiBody({type: CreateUserWithProfileDto})
  @ApiResponse({ status: 201, description: 'User created successfully', type: CreatedUserResponseDto })
  @ApiResponse({
      status: 500,
      description: "Internal Server Error",
      type: ServerErrorResponseDto,
  })
  create(@Body() createUserWithProfileDto: CreateUserWithProfileDto) {
    
    return this.usersService.create(createUserWithProfileDto);
  }

  @Get()
  @Serialize(UserListResponseDto)
  @ApiOperation({ summary: 'Get list of users, optionally filtered by role' })
//  @ApiQuery({ name: 'role', required: false, description: 'Role to filter users by', example: 'ADMIN' })
  @ApiResponse({ status: 200, description: 'List of users', type: UserListResponseDto })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error",
    type: ServerErrorResponseDto,
  })
  async findAll(
      @Query('email') email?: string,
      @Query('phone') phone?: string,
      @Query('role')  role?:  Role
  ) {
    return this.usersService.findAll({email, phone, role});
  }

  @Serialize(UserByIdResponseDto)
  @Get(':id')
  @ApiResponse({ status: 200, description: 'USER_BY_ID', type: UserByIdResponseDto })
  @ApiResponse({
    status: 404,
    description: "No_Data",
    type: NotFoundResponseDto
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error",
    type: ServerErrorResponseDto,
  })
  async findOne(@Param('id') id) {
    return this.usersService.findOne(Number(id), "http");
  }
  
  @Serialize(UpdatedUserResponseDto)
  @UseInterceptors(FileInterceptor('photoUrl'))
  @Patch(':id')
  @ApiResponse({status: 200, description: "UPDATE_USER_BY_ID", type: UpdatedUserResponseDto})
  @ApiResponse({
    status: 404,
    description: "Not_Data",
    type: ExistedDataResponseDto
  })
  @ApiResponse({
      status: 401,
      description: "You cannot edit other's user",
      type: UnauthorizeResponseDto,
    })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error",
    type: ServerErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserWithProfileDto: UpdateUserWithProfileDto,
    @Request() req
  ) {
    return this.usersService.update(id, updateUserWithProfileDto, req);
  }

  @Serialize(DeletedUserResponseDto)
  @Delete(':id')
  @ApiResponse({status: 200, description: "DELETE_USER_BY_ID", type: DeletedUserResponseDto})
  @ApiResponse({
    status: 404,
    description: "Not_Data",
    type: ExistedDataResponseDto
  })
  @ApiResponse({
    status: 401,
    description: "You cannot delete other user's data",
    type: UnauthorizeResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error",
    type: ServerErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
  //microservice
  @MessagePattern({ cmd: 'users' })
  findUserByEmail(@Payload() data: { email: string }){
    return this.usersService.findUserByEmail(data)
  }

  @MessagePattern({ cmd: 'get_user_by_id' })
  async getUser(@Payload() data: { id: number }) {
    return await this.usersService.findOne(Number(data.id), "tcp");
  }

}
