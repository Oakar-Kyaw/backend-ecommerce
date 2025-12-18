import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UseGuards,
  Req,
  Res,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './user.service';
import { CreateUserWithProfileDto, RoleEnum } from '../dto/create-user.dto';
import { UpdateUserWithProfileDto } from '../dto/update-user.dto';
import { Public } from '../../../libs/decorator/public.decorators';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { Serialize } from '../../../libs/interceptor/response.interceptor';
import {
  CreatedUserResponseDto,
  DeletedUserResponseDto,
  UpdatedUserResponseDto,
  UserByIdResponseDto,
  UserListResponseDto,
} from '../dto/user-response.dto';
import { SendOtpDto, VerifyOtpDto } from '../dto/otp.dto';
import {
  ExistedDataResponseDto,
  NotFoundResponseDto,
  ServerErrorResponseDto,
  UnauthorizeResponseDto,
} from '../../../libs/interceptor/error-response';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { FileUpload } from 'libs/utils/file-upload';
import { SyncDeviceTokenDto } from '../dto/sync-device-token.dto';

@ApiTags('Users')
@Controller('api/v1/users')
//@UseGuards(AuthGuard) // Apply AuthGuard to all routes by default
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fileUploadService: FileUpload,
  ) {}

  @Post('device-token')
  @ApiOperation({ summary: 'Sync device token' })
  syncDeviceToken(@Body() dto: SyncDeviceTokenDto) {
    return this.usersService.syncDeviceToken(dto);
  }

  @Public()
  @Serialize(CreatedUserResponseDto)
  @UseInterceptors(FileInterceptor('photoUrl'))
  @Post()
  @ApiBody({ type: CreateUserWithProfileDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: CreatedUserResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  create(@Body() createUserWithProfileDto: CreateUserWithProfileDto) {
    return this.usersService.create(createUserWithProfileDto);
  }

  @Get('analytics/admin')
  @ApiOperation({ summary: 'Get admin analytics (monthly user registrations)' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  getAdminAnalytics(@Query('year', ParseIntPipe) year: number) {
    return this.usersService.getAdminAnalytics(year);
  }

  @Get()
  @Serialize(UserListResponseDto)
  @ApiOperation({ summary: 'Get list of users, optionally filtered by role' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in email, phone, firstName, lastName',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Page size' })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Start date (ISO or yyyy-mm-dd)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'End date (ISO or yyyy-mm-dd)',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (id)',
  })
  @ApiQuery({
    name: 'isDeleted',
    required: false,
    type: Boolean,
    description: 'Filter by isDeleted status',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: RoleEnum,
    description: 'Filter by user role',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    type: UserListResponseDto,
  })
  findAll(
    @Query()
    query: {
      search?: string;
      page?: string;
      pageSize?: string;
      from?: string;
      to?: string;
      order?: 'asc' | 'desc';
      isDeleted?: boolean;
      role?: RoleEnum;
    },
  ) {
    return this.usersService.findAll(query);
  }

  @Get('export')
  async exportExcel(@Query() query?: any, @Res() res?: any) {
    const { buffer, filename } = await this.usersService.exportExcel(
      query || {},
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @MessagePattern('get_user')
  getUser(@Payload() data: { userId: number }) {
    return this.usersService.findOne(data.userId, 'tcp');
  }

  @Get(':id')
  @Serialize(UserByIdResponseDto)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    type: UserByIdResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No_Data',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    console.log('Fetching user with ID:', id);
    const user = await this.usersService.findOne(id, 'http');
    console.log('User found:', user);
    return user;
  }

  @Serialize(UpdatedUserResponseDto)
  @UseInterceptors(FileInterceptor('photoUrl'))
  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'UPDATE_USER_BY_ID',
    type: UpdatedUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not_Data',
    type: ExistedDataResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "You cannot edit other's user",
    type: UnauthorizeResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserWithProfileDto: UpdateUserWithProfileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.update(id, updateUserWithProfileDto, file);
  }

  @Serialize(DeletedUserResponseDto)
  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'DELETE_USER_BY_ID',
    type: DeletedUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Not_Data',
    type: ExistedDataResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "You cannot delete other user's data",
    type: UnauthorizeResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ServerErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Get('register/google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    console.log('google');
  }

  @Get('register/google/mobile')
  async googleRegister(@Query('code') code: string) {
    console.log('code', code);
    return this.usersService.googleRegister(code);
  }

  @Get('register/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req, @Res() res) {
    // Register or login user in DB
    const response = await this.usersService.saveGoogleUser(req.user);
    console.log('response', response);
    return {
      ...response,
    };
  }

  @Get('register/facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin(): Promise<any> {
    // Initiates the Facebook login process
  }

  @Get('register/facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @Serialize(CreatedUserResponseDto)
  async facebookLoginCallback(@Req() req): Promise<any> {
    console.log('callback', req.user);
    return this.usersService.registerFacebookUser(req.user);
  }

  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.fileUploadService.uploadSingle({ file, folderName: 'profile' });
  }

  @Public()
  @Get('forgot/otp')
  async sendOtp(@Query('email') email: string, @Query('mode') mode?: string) {
    return this.usersService.sendOtp({ email, mode });
  }

  @Public()
  @Post('otp/send')
  async sendOtpPost(@Body() body: SendOtpDto) {
    return this.usersService.sendOtp(body);
  }

  @Public()
  @Post('otp')
  @UseInterceptors(FileInterceptor('file')) // Handle multipart/form-data
  async sendOtpLegacy(@Body() body: SendOtpDto) {
    return this.usersService.sendOtp(body);
  }

  @Public()
  @Post('signup/otp')
  @UseInterceptors(FileInterceptor('file')) // Handle multipart/form-data
  async sendSignupOtp(@Body() body: SendOtpDto) {
    return this.usersService.sendOtp({ ...body, mode: 'signup' });
  }

  @Public()
  @Post('forgot/otp/verify')
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(AnyFilesInterceptor())
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const otp = body.otp || body.code;
    if (!otp) {
      throw new BadRequestException('OTP code is required');
    }
    return this.usersService.verifyOtp({ ...body, otp });
  }

  @Public()
  @Post(['otp/verify', 'signup/otp/verify'])
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(AnyFilesInterceptor())
  async verifyOtpLegacy(@Body() body: VerifyOtpDto) {
    const otp = body.otp || body.code;
    if (!otp) {
      throw new BadRequestException('OTP code is required');
    }
    return this.usersService.verifyOtp({ ...body, otp });
  }

  @Public()
  @Delete('email')
  @ApiOperation({ summary: 'Delete user by email (Dev/Testing)' })
  async deleteUserByEmail(@Query('email') email: string) {
    return this.usersService.removeByEmail(email);
  }
}
