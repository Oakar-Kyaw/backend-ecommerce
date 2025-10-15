import { Get } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { envConfig } from 'libs/config/envConfig';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  // Track users: { userId: number, socketId: string }
  private users: { id: number, socketId: string }[] = [];
  
  // Track groups: { groupId: string, userIds: number[] }
  private groups: { groupId: string, userIds: number[] }[] = [];

  // Handle new client connection
  handleConnection(@ConnectedSocket() client: Socket) {
    const userId = Number(client.handshake.query.userId);
    client.emit("handshake", { message: `User id ${userId} and client id ${client.id} is connected.` });
    this.users.push({ id: userId, socketId: client.id });
    console.log("Connected users: ", this.users);
  }

  // Handle client disconnection
  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = Number(client.handshake.query.userId);
    // Remove user from users list
    this.users = this.users.filter(user => user.socketId !== client.id);
    // Remove user from all groups
    this.groups = this.groups.map(group => ({
      ...group,
      userIds: group.userIds.filter(id => id !== userId),
    }));
    // Remove empty groups
    this.groups = this.groups.filter(group => group.userIds.length > 0);
    console.log("Disconnected user: ", userId);
    console.log("Updated users: ", this.users);
    console.log("Updated groups: ", this.groups);
  }

  // Handle joining a group
  @SubscribeMessage("joinGroup")
  handleJoinGroup(@ConnectedSocket() socket: Socket, @MessageBody() data: string) {
    const { groupId, userId } = JSON.parse(data);
    const parsedUserId = Number(userId);

    // Add user to group in memory
    const group = this.groups.find(g => g.groupId === groupId);
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
    console.log("Current groups: ", this.groups);

    // Notify group members
    this.server.to(groupId).emit("groupUpdate", {
      message: `User ${parsedUserId} joined group ${groupId}`,
      groupId,
      userIds: this.groups.find(g => g.groupId === groupId)?.userIds,
    });
  }

  // Handle leaving a group
  @SubscribeMessage("leaveGroup")
  handleLeaveGroup(@ConnectedSocket() socket: Socket, @MessageBody() data: string) {
    const { groupId, userId } = JSON.parse(data);
    const parsedUserId = Number(userId);

    // Remove user from group
    this.groups = this.groups.map(group => {
      if (group.groupId === groupId) {
        return { ...group, userIds: group.userIds.filter(id => id !== parsedUserId) };
      }
      return group;
    });

    // Leave Socket.IO room
    socket.leave(groupId);
    console.log(`User ${parsedUserId} left group ${groupId}`);

    // Notify group members
    this.server.to(groupId).emit("groupUpdate", {
      message: `User ${parsedUserId} left group ${groupId}`,
      groupId,
      userIds: this.groups.find(g => g.groupId === groupId)?.userIds,
    });

    // Clean up empty groups
    this.groups = this.groups.filter(group => group.userIds.length > 0);
    console.log("Updated groups: ", this.groups);
  }

  // Handle one-on-one messages (original functionality)
  @SubscribeMessage("message")
  handleEvent(@ConnectedSocket() socket: Socket, @MessageBody() data: string) {
    const { message, recipient, sender } = JSON.parse(data);
    const recipientUser = this.users.find(user => user.id === Number(recipient));
    const recipientSocketId = recipientUser ? recipientUser.socketId : "";

    if (recipientSocketId) {
      socket.to(recipientSocketId).emit("return-message", { message, sender });
      console.log(`Message from ${sender} to ${recipient}: ${message}`);
    } else {
      socket.emit("error", { message: `Recipient ${recipient} not found` });
    }
  }

  // Handle group messages
  @SubscribeMessage("groupMessage")
  handleGroupMessage(@ConnectedSocket() socket: Socket, @MessageBody() data: string) {
    const { message, groupId, sender } = JSON.parse(data);

    // Check if group exists
    const group = this.groups.find(g => g.groupId === groupId);
    if (!group) {
      socket.emit("error", { message: `Group ${groupId} not found` });
      return;
    }

    // Broadcast message to all group members
    this.server.to(groupId).emit("return-group-message", {
      message,
      groupId,
      sender,
    });
    console.log(`Group message from ${sender} to group ${groupId}: ${message}`);
  }
}