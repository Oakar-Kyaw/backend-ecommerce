import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create HTTP app
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log'],
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: envConfig().notification_service_tcp,
    },
  });

  await app.startAllMicroservices();

  serversetup(app, envConfig().notification_service_port);
  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().notification_service_port);
  //serversetup(app, envConfig().notification_service_port)
  console.log(
    `🚀 Noti HTTP running on ${envConfig().notification_service_port}`,
  );
  console.log(`🚀 Noti TCP running on ${envConfig().notification_service_tcp}`);
}
bootstrap();
