import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ShippingAddressController } from './shipping-address.controller';
import { ShippingAddressService } from './shipping-address.service';

import {
  ShippingLocation,
  ShippingLocationSchema,
} from '../schemas/shipping-location.schema';

import { PublishMessageModule } from 'libs/queue/publish.module';
import { envConfig } from 'libs/config/envConfig';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    // 🔹 Database connection
    MongooseModule.forRoot(envConfig().order_service_db),

    // 🔹 Register schema
    MongooseModule.forFeature([
      {
        name: ShippingLocation.name,
        schema: ShippingLocationSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    // 🔹 Queue / event publishing
    PublishMessageModule,
  ],

  controllers: [ShippingAddressController],
  providers: [ShippingAddressService],
  exports: [ShippingAddressService],
})
export class ShippingAddressModule {}
