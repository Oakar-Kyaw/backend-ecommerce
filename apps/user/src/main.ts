import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envConfig } from 'libs/config/envConfig';
import { UserModule } from './user.module';
import serversetup from 'libs/utils/server-setup';
import * as fs from 'fs';
import * as path from 'path';


async function bootstrap() {
  // Create HTTP app
  // const httpsOptions = {
  //   key: fs.readFileSync(path.join(process.cwd(), 'secrets/private-key.pem')),
  //   cert: fs.readFileSync(path.join(process.cwd(), 'secrets/public-certificate.pem')),
  // };
  const httpsOptions ={}
  const app = await NestFactory.create(UserModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: '*',
  });
  serversetup(app, envConfig().user_service_port)
  // Enable REST API on port 3000 (or any you want)
  await app.listen(envConfig().user_service_port);
  console.log(`🚀 USER HTTP running on ${envConfig().user_service_port}`);
  await app.startAllMicroservices();
}
bootstrap();
