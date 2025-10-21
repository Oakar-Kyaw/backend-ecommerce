import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envConfig } from 'libs/config/envConfig';
import { UserModule } from './user.module';
import serversetup from 'libs/utils/server-setup';
import { AllExceptionFilter } from 'libs/exception/http.exception';

async function bootstrap() {
  // Create HTTP app
  const app = await NestFactory.create(UserModule);
  serversetup(app, envConfig().user_service_port)
  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().user_service_port);
  console.log(`🚀 USER HTTP running on ${envConfig().user_service_port}`);
  await app.startAllMicroservices();
}
bootstrap();
