import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationDto,
  SaveNotificationTokenDto,
} from './dto/create-notification.dto';
import admin from 'firebase-admin';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_PRISMA } from 'apps/prisma/prisma.service';
import { EmailService } from './email.service';
import { Role } from '@prisma/notification';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_PRISMA) private readonly prisma,
    //@Inject('USER') private readonly userClient: ClientProxy,
    private readonly emailService: EmailService,
  ) {}

  async sendNotification(data: NotificationDto) {
    let { userId, brandId, branchId, role, title, body, icon } = data;
    console.log('data', data);
    
    // Ensure numeric types
    if (userId && typeof userId === 'string') userId = parseInt(userId, 10);
    if (brandId && typeof brandId === 'string') brandId = parseInt(brandId, 10);
    if (branchId && typeof branchId === 'string') branchId = parseInt(branchId, 10);

    const notificationTokenData = await this.prisma.notificationToken.findFirst(
      {
        where: {
          userId,
          ...(branchId && { branchId }),
          ...(brandId && { brandId }),
          ...(role && { role }),
        },
        orderBy: {
          id: 'desc',
        },
      },
    );
    
    if (!notificationTokenData) {
        console.warn(`User Id ${userId} doesn't subscribe noti`);
        return { success: false, message: 'No token found' };
    }

    console.log('notification data: ', notificationTokenData);
    const token = notificationTokenData.token.trim();
    try {
      const response = await admin.messaging().send({
        token,
        webpush: {
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
      console.log('response', response);
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      console.error('FCM Error:', error);
      return { success: false, message: 'FCM Error', error };
    }
  }

  async sendOrderNotification(payload: any) {
    let { email, name, userId, orderId, totalAmount, status } = payload;
    
    if (!email && userId) {
        const userEmail = await this.getUserEmail(userId);
        if (userEmail) email = userEmail;
    }

    // 1. Send Email
    if (email) {
        await this.emailService.sendNotificationEmail(
            email,
            `Order #${orderId} ${status}`,
            `Hi ${name || 'Customer'}, your order #${orderId} has been ${status}. Total: $${totalAmount}`
        );
    }

    // 2. Send Push
    if (userId) {
        await this.sendNotification({
            userId,
            title: `Order ${status}`,
            body: `Your order #${orderId} is ${status}.`,
            role: Role.CUSTOMER,
        } as any);
    }
  }

  async sendPaymentNotification(payload: any) {
    let { email, name, userId, orderId, amount, status } = payload;
    
    if (!email && userId) {
        const userEmail = await this.getUserEmail(userId);
        if (userEmail) email = userEmail;
    }

    // 1. Send Email
    if (email) {
        await this.emailService.sendNotificationEmail(
            email,
            `Payment ${status} for Order #${orderId}`,
            `Hi ${name || 'Customer'}, your payment of $${amount} for order #${orderId} was ${status}.`
        );
    }

    // 2. Send Push
    if (userId) {
        await this.sendNotification({
            userId,
            title: `Payment ${status}`,
            body: `Payment of $${amount} for Order #${orderId} : ${status}`,
            role: Role.CUSTOMER,
        } as any);
    }
  }

  private async getUserEmail(userId: string | number): Promise<string | null> {
    try {
      const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      if (isNaN(id)) return null;
      
      const response =  { data: {email: "oakarkyaw7090@gmail.com"}}
      // await firstValueFrom(
      //   // this.userClient.send('get_user', { userId: id })
      // );
      return response?.data?.email || null;
    } catch (error) {
      console.error(`Failed to fetch user ${userId}`, error);
      return null;
    }
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

    // Remove duplicates and ensure proper typing
    const tokens = Array.from(
      new Set<string>(messageToken.map((t: any) => String(t.token).trim())),
    );
    console.log('unique tokens', tokens);

    const message: admin.messaging.MulticastMessage = {
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
    console.log('userId', userId);
    if (userId) {
      const existingUser = { success: false , data : null}
      // await firstValueFrom(
      //   this.userClient.send({ cmd: 'get_user_by_id' }, { id: userId }),
      // );
      console.log('exist', existingUser);
      if (!existingUser.success)
        throw new NotFoundException(`User Id ${userId} not found`);
      //data.role = existingUser.data.role;
    }
    console.log('data to save', data);
    const token = await this.prisma.notificationToken.create({ data });
    return {
      success: true,
      message: 'Notification token saved successfully',
      data: token,
    };
  }
}
