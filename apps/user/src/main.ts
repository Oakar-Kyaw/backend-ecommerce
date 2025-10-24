import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envConfig } from 'libs/config/envConfig';
import { UserModule } from './user.module';
import serversetup from 'libs/utils/server-setup';
import * as fs from 'fs';
import * as path from 'path';
import { BrandModule } from './brand.module';
import { AppModule } from './app.module';


async function bootstrap() {
  const httpsOptions ={}
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: '*',
  });
  serversetup(app, envConfig().user_service_port)
  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().user_service_port);
  console.log(`🚀 USER HTTP running on ${envConfig().user_service_port}`);
  await app.startAllMicroservices();
}
bootstrap();
