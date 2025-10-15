// import { NestFactory } from "@nestjs/core";
// import { envConfig } from "libs/config/envConfig";
// import serversetup from "libs/utils/server-setup";
// import { ChatModule } from "./chat.module";

// async function bootstrap() {
//   const app = await NestFactory.create(ChatModule, {
//     logger: ['error', 'warn', 'debug', 'log'],
//   });

//   // Setup REST API (optional, if you plan to expose REST endpoints)
//   serversetup(app, envConfig().chat_service_port);
//   await app.listen(envConfig().chat_service_port);
//   console.log(`🚀 Chat HTTP running on ${envConfig().chat_service_port}`);

//   // Start microservices if needed
//   // app.connectMicroservice<MicroserviceOptions>({
//   //   transport: Transport.TCP,
//   //   options: {
//   //     port: envConfig().noti_service_tcp,
//   //     host: '0.0.0.0',
//   //   },
//   // });

//   await app.startAllMicroservices();
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { ChatModule } from './chat.module';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);
  serversetup(app, envConfig().chat_service_port);
  await app.listen(envConfig().chat_service_port); // HTTP REST (optional)
  console.log(`🚀 HTTP on ${envConfig().chat_service_port}, WS on ${envConfig().chat_gateway_port}`);
}
bootstrap();