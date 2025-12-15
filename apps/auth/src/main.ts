import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('NestFactory');
  console.log('Redis Config:', {
    host: envConfig().redis_host,
    port: envConfig().redis_port,
    password: envConfig().redis_password,
  });
  const app = await NestFactory.create(AuthModule);
  serversetup(app, envConfig().auth_service_port);
  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().auth_service_port);
  console.log(`🚀 Auth HTTP running on ${envConfig().auth_service_port}`);
  await app.startAllMicroservices();
}
bootstrap();
// Force rebuild comment 2
