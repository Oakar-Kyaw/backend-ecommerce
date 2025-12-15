import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MessageType } from '../schema/message.schema';
import { envConfig } from 'libs/config/envConfig';

@WebSocketGateway( envConfig().chat_gateway_port,{ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Track users: { userId: number, socketId: string }
  private users: { id: number; socketId: string }[] = [];

  // Track groups: { groupId: string, userIds: number[] }
  private groups: { groupId: string; userIds: number[] }[] = [];

  // Handle new client connection
  handleConnection(@ConnectedSocket() client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (!userId) return;

    client.emit('handshake', {
      message: `User id ${userId} and client id ${client.id} is connected.`,
    });
    this.users.push({ id: userId, socketId: client.id });
    console.log('Connected users: ', this.users);
  }

  // Handle client disconnection
  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = Number(client.handshake.query.userId);
    // Remove user from users list
    this.users = this.users.filter((user) => user.socketId !== client.id);
    // Remove user from all groups
    this.groups = this.groups.map((group) => ({
      ...group,
      userIds: group.userIds.filter((id) => id !== userId),
    }));
    // Remove empty groups
    this.groups = this.groups.filter((group) => group.userIds.length > 0);
    console.log('Disconnected user: ', userId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { recipientId: number; message: string; type: MessageType },
  ) {
    let senderId = Number(client.handshake.query.userId);
    if (isNaN(senderId)) {
       // Fallback: try to get from headers
       const headerUserId = client.handshake.headers['user-id'];
       if (headerUserId) {
         senderId = Number(headerUserId);
       }
    }

    if (isNaN(senderId)) {
      client.emit('error', { message: 'Authentication error: userId is required in handshake query (e.g., ?userId=1) or headers.' });
      return;
    }

    const { recipientId, message, type } = payload;

    if (!recipientId || !message) {
      client.emit('error', { message: 'Invalid payload: recipientId and message are required.' });
      return;
    }

    try {
      // Save to DB
      const savedMessage = await this.chatService.createMessage(
        senderId,
        recipientId,
        message,
        type || MessageType.TEXT,
      );

      // Find recipient socket(s)
      const recipientSockets = this.users.filter((u) => u.id === recipientId);

      // Emit to recipient
      recipientSockets.forEach((recipient) => {
        this.server.to(recipient.socketId).emit('newMessage', savedMessage);
      });

      // Also emit back to sender (confirm sent)
      client.emit('messageSent', savedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message', details: error.message });
    }
  }

  // Handle joining a group
  @SubscribeMessage('joinGroup')
  handleJoinGroup(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    let parsedData;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      return;
    }

    const { groupId, userId } = parsedData;
    const parsedUserId = Number(userId);

    // Add user to group in memory
    const group = this.groups.find((g) => g.groupId === groupId);
    if (group) {
      if (!group.userIds.includes(parsedUserId)) {
        group.userIds.push(parsedUserId);
      }
    } else {
      this.groups.push({ groupId, userIds: [parsedUserId] });
    }

    // Join Socket.IO room
    socket.join(groupId);
    console.log(`User ${parsedUserId} joined group ${groupId}`);

    // Notify group members
    this.server.to(groupId).emit('groupUpdate', {
      message: `User ${parsedUserId} joined group ${groupId}`,
      groupId,
      userIds: this.groups.find((g) => g.groupId === groupId)?.userIds,
    });
  }

  // Handle leaving a group
  @SubscribeMessage('leaveGroup')
  handleLeaveGroup(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    let parsedData;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      return;
    }

    const { groupId, userId } = parsedData;
    const parsedUserId = Number(userId);

    // Remove user from group
    this.groups = this.groups.map((group) => {
      if (group.groupId === groupId) {
        return {
          ...group,
          userIds: group.userIds.filter((id) => id !== parsedUserId),
        };
      }
      return group;
    });
    // Remove empty groups
    this.groups = this.groups.filter((group) => group.userIds.length > 0);

    socket.leave(groupId);

    this.server.to(groupId).emit('groupUpdate', {
      message: `User ${parsedUserId} left group ${groupId}`,
      groupId,
      userIds: this.groups.find((g) => g.groupId === groupId)?.userIds,
    });
  }
}
