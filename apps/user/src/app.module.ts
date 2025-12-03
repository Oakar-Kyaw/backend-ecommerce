// src/app.module.ts
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { BrandModule } from './brand.module';
import { RequestLoggerMiddleware } from '../../../libs/logs/logs';

@Module({
  imports: [
    UserModule,
    BrandModule, // import all your modules here
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
