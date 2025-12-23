import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { RedisConsumer } from 'libs/queue/redis/redis.consumer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EVENTS, TYPES } from 'libs/queue/constant';
import { ProductDocument, ProductMeta } from '../schemas/product.schema';
import { BrandDocument, BrandMeta } from '../schemas/brand.shema';

@Injectable()
export class OrderProductWorker extends RedisConsumer implements OnModuleInit {
  constructor(
    @InjectModel(ProductMeta.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(BrandMeta.name) private readonly brandModel: Model<BrandDocument>,
  ) {
    super(
      EVENTS.PRODUCT_EVENT,
      'order_product_group',
      `order_product_${process.pid}`,
    );
  }

  async onModuleInit() {
    await this.start();
  }

  async handle(data: any): Promise<void> {
    console.log('📩 Order product event:', data);

    switch (data.type) {
      case TYPES.CREATED_PRODUCT:
        await this.saveProduct(data);
        break;
      case TYPES.UPDATED_PRODUCT:
        await this.updateProduct(data);
        break;
      case TYPES.DELETED_PRODUCT:
        await this.deleteProduct(data.productId);
        break;
      default:
        console.warn('⚠️ Unknown event type:', data.type);
    }
  }

  private async saveProduct(data: any) {
    const brand = await this.brandModel.findOne({ brandId: data.brandId });
    await this.productModel.findOneAndUpdate(
      { productId: data.productId },
      { ...data, brandId: brand?._id },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private async updateProduct(data: any) {
    const brand = await this.brandModel.findOne({ brandId: data.brandId });
    await this.productModel.updateOne(
      { productId: data.productId },
      { ...data, brandId: brand?._id },
    );
  }

  private async deleteProduct(productId: string) {
    await this.productModel.updateOne({ productId }, { isDeleted: true });
  }
}
