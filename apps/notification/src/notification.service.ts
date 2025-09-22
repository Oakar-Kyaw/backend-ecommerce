import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationDto,
  SaveNotificationTokenDto,
} from './dto/create-notification.dto';
import admin from 'firebase-admin';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationPrismaService } from 'apps/prisma/prisma.service';
@Injectable()
export class NotificationService {
  constructor(private readonly prisma: NotificationPrismaService, @Inject('USER') private readonly userClient: ClientProxy) {}
  async sendNotification(data: NotificationDto) {
    const { userId, brandId, branchId, role, title, body, icon } = data;
    console.log("data",data);
    const notificationTokenData = await this.prisma.notificationToken.findFirst({
      where: {
        userId,
        ...(branchId && { branchId }),
        ...(brandId && { brandId }),
        ...(role && { role }),
      },
      orderBy: {
        id: 'desc',
      },
    });
    if (!notificationTokenData) throw new NotFoundException(`User Id ${userId} doesn't subscribe noti`);
    console.log('notification data: ', notificationTokenData);
    const token = notificationTokenData.token.trim();
    const response = await admin.messaging().send({
      token,
      webpush: {
        // notification: {
        //   title,
        //   body,
        //   icon,
        // },
        headers: {
          TTL: '86400', // 24 hours TTL
        },
      },
      data: {
          title: title,
          body: body,
          icon: icon || '',
      },
    });
    console.log("response",response);
    return { success: true, message: 'Notification sent successfully'};
  }

  async sendNotificationToMultipleTokens(data: NotificationDto) {
    const { brandId, branchId, role, title, body, icon } = data;
    
    const messageToken = await this.prisma.notificationToken.findMany({
      where: {
        ...(brandId && { brandId }),
        ...(branchId && { branchId }),
        ...(role && { role }),
      },
    });
    
    if (messageToken.length === 0)
      throw new NotFoundException(`Tokens don't exist.`);

    // Remove duplicates
    const tokens: string[] = [...new Set(messageToken.map((data) => data.token))];
    console.log("unique tokens", tokens);

    const message = {
      data: {
        title,
        body,
        icon,
      },
      tokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Successfully sent messages:', response);

      // Log specific errors
      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.error(`Token ${tokens[index]} failed:`, resp.error);
        }
      });

      return {
        success: true,
        message: `Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`,
      };
    } catch (error) {
      console.log('Error sending messages:', error);
      return { success: false, message: 'Failed to send notifications' };
    }
  }
  async saveNotificationToken(data: SaveNotificationTokenDto) {
    // const { userId, brandId, branchId } = data;
    const { userId } = data;
    // if (branchId) {
    //   const existingBranch = await this.prisma.branch.findUnique({
    //     where: { id: branchId, isDeleted: false },
    //   });
    //   if (!existingBranch)
    //     throw new NotFoundException(`Branch Id ${brandId} not found`);
    // }
    // if (brandId) {
    //   const existingBrand = await this.prisma.brand.findUnique({
    //     where: { id: brandId, isDeleted: false },
    //   });
    //   if (!existingBrand)
    //     throw new NotFoundException(`Brand Id ${brandId} not found`);
    // }
    console.log("userId", userId);
    if (userId) {
      const existingUser = await firstValueFrom(
        this.userClient.send({ cmd: 'get_user_by_id' }, { id: userId }),
      )
      console.log("exist", existingUser)
      if (!existingUser.success) throw new NotFoundException(`User Id ${userId} not found`);
      data.role = existingUser.data.role;
    }
    console.log("data to save", data);
    const token = await this.prisma.notificationToken.create({ data });
    return {
      success: true,
      message: 'Notification token saved successfully',
      data: token,
    };
  }
}
