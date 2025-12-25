import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { RedisConsumer } from 'libs/queue/redis.consumer';
import { EmailService } from '../email.service';
import { NotificationService } from '../notification.service';
import { Noti_PRISMA } from '../../prisma/prisma.service';
import { EVENTS, TYPES } from 'libs/queue/constant';

@Injectable()
export class NotificationUserWorker
  extends RedisConsumer
  implements OnModuleInit
{
  constructor(
    @Inject(Noti_PRISMA) private readonly prisma,
  ) {
    super(
      EVENTS.USER_EVENT,                  // stream key (shared)
      'notification_user_group',           // group (unique per service)
      `notification_user_${process.pid}`,  // consumer
    );
  }

  async onModuleInit() {
     try {
        this.start();
        console.log('✅ Notification User Worker started');
      } catch (err) {
        console.error('❌ Notification User Worker failed to start:', err);
        throw err; // Re-throw to prevent silent failures
      }
  }

  // 🔥 This replaces BullMQ process() + handlers
  async handle(data: any): Promise<void> {
    console.log('📩 Notification event:', data);

    switch (data.type) {
      /* =======================
         USER EVENTS
         ======================= */

      case TYPES.CREATED_USER:
        await this.saveUser(data);
        break;

      case TYPES.UPDATED_USER:
        await this.updateUser(data);
        break;

      case TYPES.DELETED_USER:
        await this.deleteUser(data.id);
        break;

      default:
        console.warn('⚠️ Unknown event type:', data.type);
    }
  }

  /* =======================
     USER HANDLERS (UNCHANGED LOGIC)
     ======================= */

  private async saveUser(data: any) {
    console.log('save user from notification:', data);

    await this.prisma.user.upsert({
      where: { userId: Number(data.id) },
      update: {
        userId: Number(data.id),
        email: data.email,
        phone: data.phone,
        role: data.role,
        isDeleted: false,
      },
      create: {
        userId: Number(data.id),
        email: data.email,
        phone: data.phone,
        role: data.role,
      },
    });
  }

  private async updateUser(data: any) {
    await this.prisma.user.updateMany({
      where: { userId: Number(data.id) },
      data: {
        userId: data.id,
        email: data.email,
        phone: data.phone,
        role: data.role,
      },
    });
  }

  private async deleteUser(userId: number) {
    await this.prisma.user.update({
      where: { userId: Number(userId) },
      data: { isDeleted: true },
    });
  }
}
