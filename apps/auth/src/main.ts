import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';

async function bootstrap() {
  // Create HTTP app
  const app = await NestFactory.create(AuthModule,{ logger: ['error', 'warn', 'debug', 'log'] });
  serversetup(app, envConfig().auth_service_port);
  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().auth_service_port);
  console.log(`🚀 Auth HTTP running on ${envConfig().auth_service_port}`);
  await app.startAllMicroservices();
}
bootstrap();
