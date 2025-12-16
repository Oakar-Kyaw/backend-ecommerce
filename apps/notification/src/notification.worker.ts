import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  CREATED_NOTIFICATION_SERVICE_QUEUE,
  CREATED_USER_JOB,
  CREATED_USER_SERVICE_QUEUE,
  SEND_EMAIL,
  SEND_ORDER_NOTIFICATION,
  SEND_PAYMENT_NOTIFICATION,
} from 'libs/queue/constant';
import { EmailService } from './email.service';
import { Noti_PRISMA, PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';
import { Inject } from '@nestjs/common';

// ✅ Correct handler type
type JobHandler = (job: Job) => Promise<void>;
type UserType = {
    email: string,
    phone: string,
    userId: number,
    role: string
}

@Processor(CREATED_NOTIFICATION_SERVICE_QUEUE)
export class NotificationWorker extends WorkerHost {
  private readonly handlers: Record<string, JobHandler>;

  constructor(
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
    @Inject(Noti_PRISMA) private readonly prisma
  ) {
    super();

    // ✅ Register job handlers
    this.handlers = {
      [SEND_EMAIL]: this.sendEmail.bind(this),
      [SEND_ORDER_NOTIFICATION]: this.sendOrderNotification.bind(this),
      [SEND_PAYMENT_NOTIFICATION]: this.sendPaymentNotification.bind(this),
      [CREATED_USER_JOB]: this.saveUser.bind(this),
    };
  }

  async process(job: Job): Promise<void> {
    const handler = this.handlers[job.name];

    if (!handler) {
      throw new Error(`No handler registered for job: ${job.name}`);
    }

    console.log('Processing job:', job.name, job.data);

    try {
      await handler(job);
    } catch (err) {
      console.error(
        `Notification Worker failed on job ${job.id} (${job.name}):`,
        err,
      );
      throw err; 
    }
  }

  private async sendOrderNotification(job: Job): Promise<void> {
    await this.notificationService.sendOrderNotification(job.data);
  }

  private async sendPaymentNotification(job: Job): Promise<void>{
    await this.notificationService.sendPaymentNotification(job.data)
  }

  private async sendEmail(job: Job): Promise<void> {
    await this.emailService.sendEmail(job.data);
  }

  private async saveUser(job: Job): Promise<void> {
    const data: UserType = job.data as UserType;
    console.log("data is: ", data);

    await this.prisma.user.create({
      data: {
        userId: data.userId,
        email: data.email,
        phone: data.phone,
        role: data.role,
      },
    });
  }

}

