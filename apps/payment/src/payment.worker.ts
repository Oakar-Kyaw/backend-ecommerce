// import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import {
  CREATED_ORDER_SERVICE_QUEUE,
  CREATED_PAYMENT_SERVICE_QUEUE,
  CREATED_USER_JOB,
  DELETED_USER_JOB,
  UPDATED_USER_JOB,
} from 'libs/queue/constant';
import { Processor, WorkerHost } from '@nestjs/bullmq';

// ✅ Correct handler type
type JobHandler = (job: Job) => Promise<void>;
type UserType = {
  email: string;
  phone: string;
  userId: number;
  role: string;
};

@Processor(CREATED_PAYMENT_SERVICE_QUEUE)
export class PaymentWorker extends WorkerHost {
  private readonly handlers: Record<string, JobHandler>;

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    super();

    // ✅ Register job handlers
    this.handlers = {
      [CREATED_USER_JOB]: this.saveUser.bind(this),
      [UPDATED_USER_JOB]: this.updateUser.bind(this),
      [DELETED_USER_JOB]: this.deleteUser.bind(this),
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
        `Payment Worker failed on job ${job.id} (${job.name}):`,
        err,
      );
      throw err;
    }
  }

  private async saveUser(job: Job): Promise<void> {
    const data: UserType = job.data as UserType;
    console.log('data is: ', data);
    const createUser = new this.userModel({
      userId: data.userId,
      email: data.email,
      phone: data.phone,
      role: data.role,
    });
    await createUser.save();
  }

  private async updateUser(job: Job): Promise<void> {
    const data: UserType = job.data as UserType;
    console.log('data is: ', data);
    const updateData = {
      userId: data.userId,
      email: data.email,
      phone: data.phone,
      role: data.role,
    };
    await this.userModel.findOneAndUpdate({ userId: data.userId }, updateData);
  }

  private async deleteUser(job: Job): Promise<void> {
    const data: UserType = job.data as UserType;
    console.log('data is: ', data);
    await this.userModel.findOneAndUpdate(
      { userId: data.userId },
      { isDeleted: true },
    );
  }
}
