import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { RedisConsumer } from 'libs/queue/redis/redis.consumer';
import { EVENTS, TYPES } from 'libs/queue/constant';
import { PRISMA } from 'apps/product/prisma/prisma.service';

interface UserDto {
  id: number;
  email?: string;
  phone?: string;
  role?: string;
  isDeleted?: boolean;
}


@Injectable()
export class ProductUserWorker extends RedisConsumer implements OnModuleInit {
  constructor(@Inject(PRISMA) private readonly prisma) {
    super(
      EVENTS.USER_EVENT, // stream key
      'product_user_group', // group unique for this service
      `product_user_${process.pid}`, // consumer
    );
  }

  async onModuleInit() {
    await this.start();
  }

  async handle(data: any): Promise<void> {
    console.log('📩 Product user event:', data);

    switch (data.type) {
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
        console.warn('⚠️ Unknown user event type:', data.type);
    }
  }

  private async saveUser(data: UserDto) {
    await this.prisma.user.upsert({
      where: { userId: data.id },
      update: {
        email: data.email,
        phone: data.phone,
        role: data.role,
        isDeleted: false,
      },
      create: {
        userId: data.id,
        email: data.email,
        phone: data.phone,
        role: data.role,
      },
    });
  }

  private async updateUser(data: UserDto) {
    await this.prisma.user.updateMany({
      where: { userId: data.id },
      data: {
        email: data.email,
        phone: data.phone,
        role: data.role,
      },
    });
  }

  private async deleteUser(userId: number) {
    await this.prisma.user.update({
      where: { userId },
      data: { isDeleted: true },
    });
  }
}