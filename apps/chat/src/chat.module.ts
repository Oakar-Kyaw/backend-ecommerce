import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatMessage, ChatMessageSchema } from '../schema/message.schema';
import { FileUpload } from 'libs/utils/file-upload';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from 'libs/config/envConfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: envConfig().chat_service_db,
        connectionFactory(connection) {
          console.log('Social Db is connected: ');
          return connection;
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, FileUpload],
})
export class ChatModule {}
