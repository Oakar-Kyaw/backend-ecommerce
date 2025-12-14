import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

export enum MessageType {
  TEXT = 'text',
  PHOTO = 'photo',
  VOICE = 'voice',
}

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ required: true })
  senderId: number;

  @Prop({ required: true })
  recipientId: number;

  @Prop({ required: true })
  message: string; // Text content or file URL

  @Prop({ required: true, enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop({ default: false })
  isRead: boolean;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
