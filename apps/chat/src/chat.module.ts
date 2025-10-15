import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [],
  //controllers: [ChatController],
  providers: [ChatGateway,ChatService],
})
export class ChatModule {}
