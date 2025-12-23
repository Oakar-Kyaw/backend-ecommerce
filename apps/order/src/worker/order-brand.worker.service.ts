import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { RedisConsumer } from 'libs/queue/redis/redis.consumer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EVENTS, TYPES } from 'libs/queue/constant';
import { BrandDocument, BrandMeta } from '../schemas/brand.shema';

@Injectable()
export class OrderBrandWorker extends RedisConsumer implements OnModuleInit {
  constructor(@InjectModel(BrandMeta.name) private readonly brandModel: Model<BrandDocument>) {
    super(
      EVENTS.BRAND_EVENT,
      'order_brand_group',
      `order_brand_${process.pid}`,
    );
  }

  async onModuleInit() {
    await this.start();
  }

  async handle(data: any): Promise<void> {
    console.log('📩 Order brand event:', data);

    switch (data.type) {
      case TYPES.CREATED_BRAND:
        await this.saveBrand(data);
        break;
      case TYPES.UPDATED_BRAND:
        await this.updateBrand(data);
        break;
      case TYPES.DELETED_BRAND:
        await this.deleteBrand(data.brandId);
        break;
      default:
        console.warn('⚠️ Unknown event type:', data.type);
    }
  }

  private async saveBrand(data: any) {
    await this.brandModel.findOneAndUpdate(
      { brandId: data.brandId },
      { ...data, isDeleted: false },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private async updateBrand(data: any) {
    await this.brandModel.updateOne({ brandId: data.brandId }, { ...data });
  }

  private async deleteBrand(brandId: string) {
    await this.brandModel.updateOne({ brandId }, { isDeleted: true });
  }
}
