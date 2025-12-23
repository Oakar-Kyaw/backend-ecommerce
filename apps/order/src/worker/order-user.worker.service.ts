import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { RedisConsumer } from 'libs/queue/redis/redis.consumer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EVENTS, TYPES } from 'libs/queue/constant';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class OrderUserWorker extends RedisConsumer implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {
    super(
      EVENTS.USER_EVENT,                  // shared stream for all services
      'order_user_group',                 // group unique per service
      `order_user_${process.pid}`,        // consumer name
    );
  }

  async onModuleInit() {
    try {
        this.start();
        console.log('✅ Ordker User Worker started');
      } catch (err) {
        console.error('❌ Order User Worker failed to start:', err);
        throw err; // Re-throw to prevent silent failures
      }
  }

  async handle(data: any): Promise<void> {
    console.log('📩 Order user event:', data);

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
        console.warn('⚠️ Unknown event type:', data.type);
    }
  }

  private async saveUser(data: any) {
    await this.userModel.findOneAndUpdate(
      { userId: data.id },
      {
        userId: data.id,
        email: data.email,
        phone: data.phone,
        role: data.role,
        isDeleted: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private async updateUser(data: any) {
    await this.userModel.updateMany(
      { userId: data.id },
      { userId: data.id, email: data.email, phone: data.phone, role: data.role },
    );
  }

  private async deleteUser(userId: string) {
    await this.userModel.updateOne({ userId }, { isDeleted: true });
  }
}
