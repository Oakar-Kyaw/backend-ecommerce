import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order, OrderSchema } from './schemas/order.schema';
import {
  ShippingLocation,
  ShippingLocationSchema,
} from './schemas/shipping-location.schema';
import { envConfig } from 'libs/config/envConfig';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { User, UserSchema } from './schemas/user.schema';
//import { OrderWorker } from './order.worker';
import { BrandMeta, BrandSchema, } from './schemas/brand.shema';
import { ProductMeta, ProductSchema } from './schemas/product.schema';
import { OrderUserWorker } from './worker/order-user.worker.service';

@Module({
  imports: [
    MongooseModule.forRoot(envConfig().order_service_db),
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: ShippingLocation.name, schema: ShippingLocationSchema },
      { name: User.name, schema: UserSchema },
      { name: ProductMeta.name, schema: ProductSchema },
      { name: BrandMeta.name, schema: BrandSchema },
    ]),
   // PublishMessageModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '0.0.0.0',
          port: envConfig().notification_service_tcp,
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [
    OrderService
    ],
})
export class OrderModule {}
