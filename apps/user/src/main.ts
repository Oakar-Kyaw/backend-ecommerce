import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envConfig } from 'libs/config/envConfig';
import { UserModule } from './user.module';
import serversetup from 'libs/utils/server-setup';

async function bootstrap() {
  // Create HTTP app
  const app = await NestFactory.create(UserModule);
  serversetup(app, envConfig().user_service_port)
  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().user_service_port);
  console.log(`🚀 USER HTTP running on ${envConfig().user_service_port}`);

  // Also connect TCP microservice (for inter-service calls)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: envConfig().user_service_tcp, // <- must match what USER service expects
      host: '0.0.0.0',
     //host: 'auth'
    },
  });

  await app.startAllMicroservices();
  console.log(`🚀 USER TCP microservice running on port ${envConfig().user_service_tcp}`);
}
bootstrap();
