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
    let {
      userId,
      brandId,
      branchId,
      role,
      title,
      body,
      icon,
      type,
      data: extraData,
    } = data;
    console.log('data', data);

    // Ensure numeric types
    if (userId && typeof userId === 'string') userId = parseInt(userId, 10);
    if (brandId && typeof brandId === 'string') brandId = parseInt(brandId, 10);
    if (branchId && typeof branchId === 'string')
      branchId = parseInt(branchId, 10);

    // Save to Notification Table
    try {
      await this.prisma.notification.create({
        data: {
          userId: userId || null,
          brandId: brandId || null,
          title,
          body,
          type: type || 'GENERAL',
          data: extraData || {},
        },
      });
    } catch (error) {
      console.error('Error saving notification to DB:', error);
    }

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
      const message: admin.messaging.Message = {
        token,
        notification: {
          title,
          body,
        },
        webpush: {
          headers: {
            TTL: '86400',
          },
          notification: {
            title,
            body,
          },
        },
        data: {
          icon: icon || '',
          type: type || 'GENERAL',
          ...(extraData || {}),
        },
      };
      const hasValidIcon =
        typeof icon === 'string' &&
        /^https?:\/\//.test(icon) &&
        icon.length > 5;
      if (hasValidIcon) {
        message.notification = {
          title,
          body,
          imageUrl: icon,
        };
        message.android = {
          notification: {
            imageUrl: icon,
          },
        };
        message.webpush = {
          headers: {
            TTL: '86400',
          },
          notification: {
            title,
            body,
            image: icon,
          },
        };
      }
      const response = await admin.messaging().send(message);
      console.log('response', response);
      return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
      console.error('FCM Error:', error);
      const code = String((error as any)?.errorInfo?.code || '');
      if (code.includes('registration-token-not-registered')) {
        await this.prisma.notificationToken.deleteMany({
          where: { token },
        });
        console.log('Removed invalid token', token);
      }
      return { success: false, message: 'FCM Error', error };
    }
  }

  async sendOrderNotification(payload: any) {
    let {
      email,
      name,
      userId,
      orderId,
      totalAmount,
      status,
      items,
      shippingAddress,
    } = payload;

    console.log('send order notif: ', payload);
    if (!email && userId) {
      const userEmail = await this.getUserEmail(userId);
      if (userEmail) email = userEmail;
    }

    // 1. Send Email
    if (email) {
      const itemsHtml =
        items && items.length
          ? items
              .map(
                (item: any) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                  ${item.image ? `<img src="${item.image}" alt="${item.name}" width="50" style="vertical-align: middle; margin-right: 10px;">` : ''}
                  ${item.name || item.productId}
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">$${item.price}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">$${item.price * item.quantity}</td>
            </tr>
        `,
              )
              .join('')
          : '<tr><td colspan="4">No details available</td></tr>';

      const addressHtml = shippingAddress
        ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                <h4 style="margin: 0 0 10px 0; color: #555;">Shipping Address</h4>
                <p style="margin: 0; color: #666;">
                    ${shippingAddress.address}, ${shippingAddress.city}<br>
                    Phone: ${shippingAddress.phone}
                </p>
            </div>
        `
        : '';

      const fullHtml = `
            <h2 style="color: #333;">Order Update</h2>
            <p>Hi ${name || 'Customer'},</p>
            <p>Your order <strong>#${orderId}</strong> status is now: <span style="color: #0b6fff; font-weight: bold;">${status}</span></p>
            
            <h3 style="margin-top: 20px; color: #444;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #f4f4f4;">
                        <th style="text-align: left; padding: 12px; color: #555;">Product</th>
                        <th style="text-align: left; padding: 12px; color: #555;">Qty</th>
                        <th style="text-align: left; padding: 12px; color: #555;">Price</th>
                        <th style="text-align: left; padding: 12px; color: #555;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align: right; padding: 12px; font-weight: bold;">Total Amount:</td>
                        <td style="padding: 12px; font-weight: bold;">$${totalAmount}</td>
                    </tr>
                </tfoot>
            </table>
            
            ${addressHtml}
        `;

      await this.emailService.sendEmail({
        to: email,
        subject: `Order #${orderId} ${status}`,
        html: fullHtml,
      });
    }

    // 2. Send Push
    if (userId) {
      const firstItem = items && items.length > 0 ? items[0] : null;
      const image = firstItem
        ? firstItem.image || firstItem.mainImage || ''
        : '';

      await this.sendNotification({
        userId,
        title: `Order ${status}`,
        body: `Your order #${orderId} is ${status}.`,
        role: Role.CUSTOMER,
        icon: image,
        type: 'ORDER_STATUS_UPDATE',
        data: { orderId, status },
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
        `Hi ${name || 'Customer'}, your payment of $${amount} for order #${orderId} was ${status}.`,
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

      const user = await this.prisma.user.findFirst({
        where: {
          userId,
        },
      });
      console.log('email', user);
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
    let {
      brandId,
      branchId,
      role,
      title,
      body,
      icon,
      type,
      data: extraData,
      tokens: explicitTokens,
    } = data;

    // Ensure numeric types
    if (brandId && typeof brandId === 'string') brandId = parseInt(brandId, 10);
    if (branchId && typeof branchId === 'string')
      branchId = parseInt(branchId, 10);

    // Save to Notification Table
    try {
      if (brandId) {
        await this.prisma.notification.create({
          data: {
            brandId: brandId || null,
            title,
            body,
            type: type || 'GENERAL',
            data: extraData || {},
          },
        });
      }
    } catch (error) {
      console.error('Error saving notification to DB:', error);
    }

    const messageToken = await this.prisma.notificationToken.findMany({
      where: {
        ...(brandId && { brandId }),
        ...(branchId && { branchId }),
        ...(role && { role }),
      },
    });

    // Combine DB tokens with explicit tokens
    const dbTokens = messageToken.map((t: any) => String(t.token).trim());
    const allTokens = [...dbTokens, ...(explicitTokens || [])];

    if (allTokens.length === 0) {
      console.log(`No tokens found for notification: ${title}`);
      return { success: false, message: 'No tokens found' };
    }

    // Remove duplicates and ensure proper typing
    const tokens = Array.from(new Set<string>(allTokens));
    console.log('unique tokens', tokens);

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          title,
          body,
        },
      },
      data: {
        icon: icon || '',
        type: type || 'GENERAL',
        ...(extraData || {}),
      },
      tokens,
    };
    const hasValidIcon =
      typeof icon === 'string' && /^https?:\/\//.test(icon) && icon.length > 5;
    if (hasValidIcon) {
      message.notification = {
        title,
        body,
        imageUrl: icon,
      };
      message.android = {
        notification: {
          imageUrl: icon,
        },
      };
      message.webpush = {
        notification: {
          title,
          body,
          image: icon,
        },
      };
    }

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Successfully sent messages:', response);

      const invalidTokenIndices = response.responses
        .map((resp, index) =>
          !resp.success &&
          String((resp.error as any)?.code).includes(
            'registration-token-not-registered',
          )
            ? index
            : -1,
        )
        .filter((i) => i >= 0);
      if (invalidTokenIndices.length > 0) {
        const invalids = invalidTokenIndices.map((i) => tokens[i]);
        await this.prisma.notificationToken.deleteMany({
          where: {
            token: { in: invalids },
          },
        });
        console.log('Removed invalid tokens', invalids);
      }

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
    let { brandId, orderId, items, status, shippingAddress } = payload;

    // Ensure numeric types
    if (brandId && typeof brandId === 'string') brandId = parseInt(brandId, 10);
    console.log(
      `Processing notification for Brand ${brandId} regarding Order #${orderId}`,
    );

    // 1. Fetch Brand Details (Email)
    //const brand = await this.fetchBrandDetails(brandId);
    const brand  = await this.prisma.brand.findUnique({ where: { brandId } })
    console.log("notification brand: ",payload)
    if (brand && brand.email) {
      // 2. Send Email to Brand
      const itemsListHtml = items
        .map(
          (item: any) =>
            `<li style="padding-bottom: 10px;">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" width="30" style="vertical-align: middle; margin-right: 5px;">` : ''}
              ${item.quantity}x ${item.name || item.productId} - $${item.price}
            </li>`,
        )
        .join('');

      const addressHtml = shippingAddress
        ? `
            <div style="margin-top: 20px; padding: 10px; background-color: #f9f9f9; border: 1px solid #eee;">
                <h4 style="margin: 0 0 5px 0;">Shipping Details</h4>
                <p style="margin: 0;">
                    ${shippingAddress.address}, ${shippingAddress.city}<br>
                    Phone: ${shippingAddress.phone} <br>
                    Email: ${shippingAddress.email}
                </p>
            </div>
        `
        : '';

      await this.emailService.sendNotificationEmail(
        brand.email,
        `New Order #${orderId} Received`,
        `<h3>New Order Received</h3>
             <p>Hello ${brand.name},</p>
             <p>You have received a new order #${orderId}.</p>
             <p><strong>Status:</strong> ${status}</p>
             <ul>${itemsListHtml}</ul>
             ${addressHtml}
             <p>Please log in to your dashboard to manage this order.</p>`,
      );
      console.log(`Email sent to brand ${brand.name} at ${brand.email}`);
    } else {
      console.warn(`Could not fetch brand email for Brand ID ${brandId}`);
    }

    // 3. Send Push Notification to Brand Users (Admins/Staff)
    // Fetch users linked to the brand from User Service
    let explicitTokens: string[] = [];
    try {
      const users = await this.fetchBrandUsers(brandId);
      if (users && users.length > 0) {
        // Collect user IDs to fetch tokens from Auth Service
        const userIds = users
          .map((u: any) => u.user?.id || u.user?.userId)
          .filter((id: any) => id);

        // Fetch tokens from Auth Service
        const authUsers = await this.fetchTokensFromAuth(userIds);

        // Combine tokens from Auth Service
        const authTokens = authUsers
          .map((u: any) => u.device_tokens || [])
          .flat();

        // Also keep tokens from User Service just in case
        const userTokens = users
          .map((u: any) => u.user?.device_tokens || [])
          .flat();

        explicitTokens = [...authTokens, ...userTokens].filter(
          (t: string) => t,
        );
      }
    } catch (error) {
      console.error(
        'Failed to fetch brand users for push notification:',
        error,
      );
    }

    try {
      const firstItem = items && items.length > 0 ? items[0] : null;
      const image = firstItem
        ? firstItem.image || firstItem.mainImage || ''
        : '';

      await this.sendNotificationToMultipleTokens({
        brandId: brandId.toString(),
        title: 'New Order Received',
        body: `Order #${orderId} has been placed containing your items.`,
        role: undefined,
        icon: image,
        type: 'ORDER_CREATED',
        data: { orderId },
        tokens: explicitTokens,
      } as any);
    } catch (e) {
      console.log(
        'No push tokens found for brand or error sending push:',
        e.message,
      );
    }
  }

  async sendBrandStatusUpdateNotification(payload: any) {
    let { orderId, userId, brandId, status, email, items } = payload;
    console.log(
      `Processing status update notification for Order #${orderId}, Brand ${brandId} -> ${status}`,
    );

    // Ensure numeric types
    if (brandId && typeof brandId === 'string') brandId = parseInt(brandId, 10);
    if (userId && typeof userId === 'string') userId = parseInt(userId, 10);

    // 1. Send Email to User
    if (email) {
      const itemsListHtml = items
        .map(
          (item: any) =>
            `<li>
              ${item.image ? `<img src="${item.image}" alt="${item.name}" width="30" style="vertical-align: middle; margin-right: 5px;">` : ''}
              ${item.quantity}x ${item.name || item.productId} - $${item.price}
            </li>`,
        )
        .join('');

      await this.emailService.sendNotificationEmail(
        email,
        `Order Status Update #${orderId}`,
        `<h3>Order Status Updated</h3>
         <p>Your order #${orderId} has been updated.</p>
         <p><strong>New Status:</strong> ${status}</p>
         <p>Items in this update:</p>
         <ul>${itemsListHtml}</ul>
         <p>Thank you for shopping with us!</p>`,
      );
      console.log(`Status update email sent to user ${email}`);
    }

    // 2. Send Push Notification to User
    try {
      const firstItem = items && items.length > 0 ? items[0] : null;
      const image = firstItem
        ? firstItem.image || firstItem.mainImage || ''
        : '';

      await this.sendNotification({
        userId,
        title: 'Order Status Updated',
        body: `Your order #${orderId} is now ${status}.`,
        icon: image,
        type: 'ORDER_STATUS_UPDATE',
        data: { orderId, status, brandId },
      } as any);
    } catch (e) {
      console.log(
        'No push token found for user or error sending push:',
        e.message,
      );
    }
  }

  private async fetchBrandUsers(brandId: number) {
    if (!brandId) return [];
    try {
      const baseUrl = envConfig().user_service_url;
      const url = `${baseUrl}/brands/${brandId}/users`;
      const response = await axios.get(url);
      return response.data; // Assuming returns array of BrandUserRelationship with user included
    } catch (error) {
      console.error(
        `Error fetching brand users for ID ${brandId}:`,
        error.message,
      );
      return [];
    }
  }

  private async fetchBrandDetails(brandId: number) {
    if (!brandId) return null;
    try {
      const baseUrl = envConfig().user_service_url;
      const url = `${baseUrl}/brands/${brandId}`;
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching brand details for ID ${brandId}:`,
        error.message,
      );
      return null;
    }
  }

  private async fetchTokensFromAuth(userIds: number[]) {
    if (!userIds || userIds.length === 0) return [];
    try {
      const authUrl = envConfig().auth_service_url;
      const baseUrl = authUrl.replace(/\/api\/v1\/?$/, '');
      const finalUrl = `${baseUrl}/api/auth/device-tokens`;

      const response = await axios.post(finalUrl, { userIds });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tokens from Auth Service:', error.message);
      return [];
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
      const existingUser = { success: false, data: null };
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
