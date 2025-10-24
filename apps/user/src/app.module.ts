// src/app.module.ts
import { Module } from '@nestjs/common';
import { UserModule } from './user.module';
import { BrandModule } from './brand.module';

@Module({
  imports: [
    UserModule,
    BrandModule   // import all your modules here
  ],
})
export class AppModule {}
