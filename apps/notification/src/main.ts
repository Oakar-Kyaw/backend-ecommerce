import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envConfig } from 'libs/config/envConfig';

async function bootstrap() {
  // Create HTTP app
  const app = await NestFactory.create(NotificationModule,{ logger: ['error', 'warn', 'debug', 'log'] });

  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().noti_service_port);
  console.log(`🚀 Noti HTTP running on ${envConfig().noti_service_port}`);

  // Also connect TCP microservice (for inter-service calls)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: envConfig().noti_service_tcp, // <- must match what USER service expects
      //host: '0.0.0.0',
      host: 'user'
    },
  });

  await app.startAllMicroservices();
  console.log(`🚀 Noti TCP microservice running on port ${envConfig().auth_service_tcp}`);
}
bootstrap();
