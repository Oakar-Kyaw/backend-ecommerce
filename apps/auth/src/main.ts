import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';
import { AllExceptionFilter } from 'libs/exception/http.exception';

async function bootstrap() {
  // Create HTTP app
  const app = await NestFactory.create(AuthModule,{ logger: ['error', 'warn', 'debug', 'log'] });
  serversetup(app, envConfig().auth_service_port);
  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().auth_service_port);
  console.log(`🚀 Auth HTTP running on ${envConfig().auth_service_port}`);
  //serversetup(app, envConfig().auth_service_port)
  // Also connect TCP microservice (for inter-service calls)
  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.TCP,
  //   options: {
  //     port: envConfig().auth_service_tcp, // <- must match what USER service expects
  //     host: '0.0.0.0',
  //     //host: 'user'
  //   },
  // });

  await app.startAllMicroservices();
}
bootstrap();
