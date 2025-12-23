import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { RedisConsumer } from 'libs/queue/redis/redis.consumer';
import { EmailService } from '../email.service';
import { NotificationService } from '../notification.service';
import { Noti_PRISMA } from '../../prisma/prisma.service';
import { EVENTS, TYPES } from 'libs/queue/constant';

@Injectable()
export class NotificationWorker
  extends RedisConsumer
  implements OnModuleInit
{
  constructor(
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {
    super(
      EVENTS.NOTI_EVENT,                  // stream key (shared)
      'notification_group',           // group (unique per service)
      `notification_${process.pid}`,  // consumer
    );
  }

  // async onModuleInit() {
  //   await this.start();
  // }
  async onModuleInit() {
     try {
      this.start();
      console.log('✅ Notification Worker started');
    } catch (err) {
      console.error('❌ Notification Worker failed to start:', err);
      throw err; // Re-throw to prevent silent failures
    }
  }

  // 🔥 This replaces BullMQ process() + handlers
  async handle(data: any): Promise<void> {
    console.log('📩 Notification event:', data);

    switch (data.type) {

      /* =======================
         NOTIFICATION EVENTS
         ======================= */

      case TYPES.SEND_EMAIL:
        await this.emailService.sendEmail(data);
        break;

      case TYPES.SEND_ORDER_NOTIFICATION:
        await this.notificationService.sendOrderNotification(data);
        break;

      case TYPES.SEND_PAYMENT_NOTIFICATION:
        await this.notificationService.sendPaymentNotification(data);
        break;

      case TYPES.SEND_BRAND_STATUS_UPDATE_NOTIFICATION:
        await this.notificationService.sendBrandStatusUpdateNotification(data);
        break;

      default:
        console.warn('⚠️ Unknown event type:', data.type);
    }
  }
}
