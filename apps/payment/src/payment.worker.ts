import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { RedisConsumer } from 'libs/queue/redis/redis.consumer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EVENTS, TYPES } from 'libs/queue/constant';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class PaymentUserWorker extends RedisConsumer implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {
    super(
      EVENTS.USER_EVENT,                  // stream key (shared)
      'payment_user_group',               // group (unique per service)
      `payment_user_${process.pid}`,      // consumer
    );
  }

  async onModuleInit() {
    try {
        this.start();
        console.log('✅ Payment Worker started');
      } catch (err) {
        console.error('❌ Payment Worker failed to start:', err);
        throw err; // Re-throw to prevent silent failures
      }
  }

  // 🔥 This replaces BullMQ process() + handlers
  async handle(data: any): Promise<void> {
    console.log('📩 Payment user event:', data);

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

  /* =======================
     USER HANDLERS
     ======================= */

  private async saveUser(data: any) {
    console.log('Save user from payment:', data);

    await this.userModel.findOneAndUpdate(
      { userId: data.id }, // unique key
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
    console.log('Update user from payment:', data);

    await this.userModel.updateOne(
      { userId: data.id },
      {
        userId: data.id,
        email: data.email,
        phone: data.phone,
        role: data.role,
      },
    );
  }

  private async deleteUser(userId: number) {
    console.log('Delete user from payment:', userId);

    await this.userModel.updateOne(
      { userId },
      { isDeleted: true },
    );
  }
}
