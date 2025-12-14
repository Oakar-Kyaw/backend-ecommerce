import { NestFactory } from '@nestjs/core';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';
// import '../config/dbConfig';
import { PaymentModule } from './payment.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule);
  serversetup(app, envConfig().payment_service_port);
  await app.listen(envConfig().payment_service_port ?? 3000);
  console.log("server is running: ", envConfig().payment_service_port);
}
bootstrap();
