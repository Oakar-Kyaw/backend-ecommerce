import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create HTTP app
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'debug', 'log'] });
  serversetup(app, envConfig().noti_service_port)
  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().noti_service_port);
  //serversetup(app, envConfig().noti_service_port)
  console.log(`🚀 Noti HTTP running on ${envConfig().noti_service_port}`);

  // Also connect TCP microservice (for inter-service calls)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: envConfig().noti_service_tcp, // <- must match what USER service expects
      host: '0.0.0.0',
      //host: 'user'
    },
  });

  await app.startAllMicroservices();
  console.log(`🚀 Noti TCP microservice running on port ${envConfig().noti_service_tcp}`);
}
bootstrap();
