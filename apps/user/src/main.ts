import { NestFactory } from '@nestjs/core';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  serversetup(app, envConfig().user_service_port);
  
  // Enable TCP Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: envConfig().user_service_tcp,
    },
  });

  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().user_service_port, '0.0.0.0');
  await app.startAllMicroservices();
  console.log(`🚀 USER HTTP running on ${envConfig().user_service_port}`);
  console.log(`🚀 USER TCP running on ${envConfig().user_service_tcp}`);
}
bootstrap();
// Force rebuild comment 2
