import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';
import '../config/dbConfig';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule);
  serversetup(app, envConfig().order_service_port);
  await app.listen(envConfig().order_service_port ?? 3000);
  console.log("server is running: ", envConfig().order_service_port);
}
bootstrap();
