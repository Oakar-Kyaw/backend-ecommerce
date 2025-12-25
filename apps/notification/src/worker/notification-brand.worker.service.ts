import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { RedisConsumer } from 'libs/queue/redis.consumer';
import { EVENTS, TYPES } from 'libs/queue/constant';
import { Noti_PRISMA } from 'apps/notification/prisma/prisma.service';

interface BrandDto {
  brandId: number;
  email?: string;
  name?: string;
  imageUrl?: string;
}

@Injectable()
export class NotificationBrandWorker extends RedisConsumer implements OnModuleInit {
  constructor(@Inject(Noti_PRISMA) private readonly prisma) {
    super(
      EVENTS.BRAND_EVENT, // stream key
      'notification_brand_group', // group unique for this service
      `notification_brand_${process.pid}`, // consumer
    );
  }

  async onModuleInit() {
    try {
        this.start();
        console.log('✅ Notification Brand Worker started');
      } catch (err) {
        console.error('❌ Notification Brand Worker failed to start:', err);
        throw err; // Re-throw to prevent silent failures
      }
  }

  async handle(data: any): Promise<void> {
    console.log('📩 Product brand event:', data);

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
        console.warn('⚠️ Unknown brand event type:', data.type);
    }
  }

  private async saveBrand(data: BrandDto) {
    await this.prisma.brand.upsert({
      where: { brandId: data.brandId },
      update: {
        name: data.name,
        email: data.email,
        imageUrl: data.imageUrl,
        isDeleted: false,
      },
      create: {
        brandId: data.brandId,
        name: data.name,
        email: data.email,
        imageUrl: data.imageUrl,
      },
    });
  }

  private async updateBrand(data: BrandDto) {
    await this.prisma.brand.update({
      where: { brandId: data.brandId },
      data: {
        name: data.name,
        email: data.email,
        imageUrl: data.imageUrl,
      },
    });
  }

  private async deleteBrand(brandId: number) {
    await this.prisma.brand.deleteMany({ where: { brandId } });
  }
}