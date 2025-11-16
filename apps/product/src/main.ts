import { NestFactory } from '@nestjs/core';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: '*',
  });
  serversetup(app, envConfig().product_service_port)
  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().product_service_port);
  console.log(`🚀 Product HTTP running on ${envConfig().product_service_port}`);
  await app.startAllMicroservices();
}
bootstrap();
