import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationDto,
  SaveNotificationTokenDto,
} from './dto/create-notification.dto';
import admin from 'firebase-admin';
import { EmailService } from './email.service';
import { Role } from '@prisma/notification';
import { Noti_PRISMA } from '../prisma/prisma.service';
import axios from 'axios';
import { envConfig } from 'libs/config/envConfig';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(Noti_PRISMA) private readonly prisma,
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
    
    console.log("send order notif: ", payload)
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
      
      const user =  await this.prisma.users.findFirst({
        where: {
           userId
        }
      })
      console.log("email", user)
      // await firstValueFrom(
      //   // this.userClient.send('get_user', { userId: id })
      // );
      return user.email || null;
    } catch (error) {
      console.error(`Failed to fetch user ${userId}`, error);
      return null;
    }
  }


  async sendNotificationToMultipleTokens(data: NotificationDto) {
    let { brandId, branchId, role, title, body, icon } = data;

    // Ensure numeric types
    if (brandId && typeof brandId === 'string') brandId = parseInt(brandId, 10);
    if (branchId && typeof branchId === 'string') branchId = parseInt(branchId, 10);

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
  async sendBrandOrderNotification(payload: any) {
    const { brandId, orderId, items, status } = payload;
    console.log(`Processing notification for Brand ${brandId} regarding Order #${orderId}`);
    
    // 1. Fetch Brand Details (Email)
    const brand = await this.fetchBrandDetails(brandId);
    
    if (brand && brand.email) {
        // 2. Send Email to Brand
        const itemsListHtml = items.map((item: any) => 
            `<li>${item.quantity}x Product ID ${item.productId} - $${item.price}</li>`
        ).join('');

        await this.emailService.sendNotificationEmail(
            brand.email,
            `New Order #${orderId} Received`,
            `<h3>New Order Received</h3>
             <p>Hello ${brand.name},</p>
             <p>You have received a new order #${orderId}.</p>
             <p><strong>Status:</strong> ${status}</p>
             <ul>${itemsListHtml}</ul>
             <p>Please log in to your dashboard to manage this order.</p>`
        );
        console.log(`Email sent to brand ${brand.name} at ${brand.email}`);
    } else {
        console.warn(`Could not fetch brand email for Brand ID ${brandId}`);
    }

    // 3. Send Push Notification to Brand Users (Admins/Staff)
    // Assuming brand users have role 'BRAND_ADMIN' or similar and are linked via brandId
    // Note: The current NotificationToken schema supports 'brandId'.
    // We notify all tokens associated with this brandId.
    
    try {
        await this.sendNotificationToMultipleTokens({
            brandId: brandId.toString(),
            title: 'New Order Received',
            body: `Order #${orderId} has been placed containing your items.`,
            role: undefined, // Send to all roles under this brand? Or specific? Let's assume all for now.
        } as any);
    } catch (e) {
        console.log('No push tokens found for brand or error sending push:', e.message);
    }
  }

  private async fetchBrandDetails(brandId: number) {
    if (!brandId) return null;
    try {
      const url = `http://localhost:${envConfig().user_service_port}/api/v1/brands/${brandId}`;
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching brand details for ID ${brandId}:`, error.message);
      return null;
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
