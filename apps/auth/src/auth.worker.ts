import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  CREATED_USER_SERVICE_QUEUE,
  CREATED_USER_JOB,
  UPDATED_USER_JOB,
  DELETED_USER_JOB,
  CREATED_AUTH_SERVICE_QUEUE,
} from 'libs/queue/constant';
import { AUTH_PRISMA } from '../prisma/auth.prisma.service';

interface UserDto {
  userId?: number;
  email?: string;
  phone?: string;
  password?: string;
  isDeleted?: boolean;
  role?: any;
}

// ✅ Job handler type
type JobHandler = (job: Job) => Promise<any>;

class UserService {
  constructor(@Inject(AUTH_PRISMA) private readonly prisma) {}

  async createUser(data: UserDto) {
    if (!data?.email) {
      throw new Error('Missing required fields: email');
    }
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.log(
        `User with email ${data.email} already exists, skipping creation.`,
      );
      return;
    }
    const createdUser = await this.prisma.user.create({ data });
    const { password, ...safeUser } = createdUser;
    return safeUser;
  }

  async updateUser(userId: number, data: UserDto) {
    console.log('update user', userId, data);
    const updatedUser = await this.prisma.user.update({
      where: { userId },
      data,
    });
    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }

  async deleteUser(userId: number) {
    const deletedUser = await this.prisma.user.update({
      where: { userId },
      data: { isDeleted: true },
    });
    const { password, ...safeUser } = deletedUser;
    return safeUser;
  }
}

@Processor(CREATED_USER_SERVICE_QUEUE)
export class AuthWorker extends WorkerHost {
  private readonly handlers: Record<string, JobHandler>;

  constructor(@Inject(AUTH_PRISMA) private readonly prisma) {
    super();

    const userService = new UserService(this.prisma);

    // ✅ Register job handlers
    this.handlers = {
      [CREATED_USER_JOB]: async (job: Job) => {
        const payload = job.data as UserDto;
        return await userService.createUser(payload);
      },
      [UPDATED_USER_JOB]: async (job: Job) => {
        const data = job.data as UserDto;
        if (!data.userId) throw new Error('Missing userId for update');
        return await userService.updateUser(data.userId, data);
      },
      [DELETED_USER_JOB]: async (job: Job) => {
        const { userId } = job.data as UserDto;
        if (!userId) throw new Error('Missing userId for deletion');
        return await userService.deleteUser(userId);
      },
    };
  }

  async process(job: Job): Promise<any> {
    console.log('Processing job:', job.name, job.data);
    const handler = this.handlers[job.name];
    if (!handler) {
      throw new Error(`No handler registered for job: ${job.name}`);
    }

    try {
      await handler(job);
    } catch (err) {
      console.error(`AuthWorker failed on job ${job.id} (${job.name}):`, err);
      throw err; // let BullMQ handle retries
    }
  }
}
