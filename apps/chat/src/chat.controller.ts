import {
  Controller,
  Post,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { FileUpload } from 'libs/utils/file-upload';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Chat')
@Controller('api/v1/chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly fileUpload: FileUpload,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    // Assume photos and voice are stored in 'chat-media' folder
    return this.fileUpload.uploadSingle({ file, folderName: 'chat-media' });
  }

  @Get('history')
  @ApiOperation({ summary: 'Get chat history between two users' })
  async getHistory(
    @Query('user1') user1: number,
    @Query('user2') user2: number,
  ) {
    if (!user1 || !user2) {
      throw new BadRequestException('Both user1 and user2 are required');
    }
    return this.chatService.getMessages(Number(user1), Number(user2));
  }
}
