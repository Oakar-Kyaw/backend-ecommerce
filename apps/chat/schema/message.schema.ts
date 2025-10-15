
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Expose, Transform } from 'class-transformer';
import { HydratedDocument } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema()
export class ChatMessage {
  @Prop({required: true})
  sender: number;

  @Prop({required: true})
  reciepent: number;

  @Prop({required: true})
  message: string;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
