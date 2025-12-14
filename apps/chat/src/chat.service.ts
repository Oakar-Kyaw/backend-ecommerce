import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument, MessageType } from '../schema/message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name) private chatModel: Model<ChatMessageDocument>,
  ) {}

  async createMessage(
    senderId: number,
    recipientId: number,
    message: string,
    type: MessageType = MessageType.TEXT,
  ): Promise<ChatMessage> {
    const newMessage = new this.chatModel({
      senderId,
      recipientId,
      message,
      type,
    });
    return newMessage.save();
  }

  async getMessages(user1: number, user2: number): Promise<ChatMessage[]> {
    return this.chatModel
      .find({
        $or: [
          { senderId: user1, recipientId: user2 },
          { senderId: user2, recipientId: user1 },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();
  }

  async markAsRead(recipientId: number, senderId: number) {
    return this.chatModel.updateMany(
      { senderId, recipientId, isRead: false },
      { $set: { isRead: true } },
    );
  }
}
