// src/app.module.ts
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { RequestLoggerMiddleware } from '../../../libs/loggers/logs-implementation';
import { OrderModule } from './order.module';
import { ShippingAddressModule } from './shipping-address/shipping-address.module';
import { OrderWorkerModule } from './worker/order-worker.module';

@Module({
  imports: [
    ShippingAddressModule,
    OrderModule,
    OrderWorkerModule
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
