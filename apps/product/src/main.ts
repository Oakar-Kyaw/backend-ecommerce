import { NestFactory } from '@nestjs/core';
import { envConfig } from 'libs/config/envConfig';
import serversetup from 'libs/utils/server-setup';
import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.enableCors({
//     origin: '*',
//     methods: 'GET,POST,PUT,DELETE,OPTIONS',
//     allowedHeaders: '*',
//   });
//   serversetup(app, envConfig().product_service_port);
//   await app.getHttpAdapter().get('/', (req, res) => res.send('Hello World!'));

//   // Enable REST API on port 3000 (or any you want)
//   console.log(envConfig().product_service_port)
//   await app.listen(envConfig().product_service_port,  '0.0.0.0');
//   console.log(`🚀 Product HTTP running on ${envConfig().product_service_port}`);
//   //await app.startAllMicroservices();
// }
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: '*',
  });

  const port = envConfig().product_service_port || 5004;

  // Bind to all interfaces (0.0.0.0) for WSL/Docker/external access
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Product HTTP running on port ${port}`);
}
bootstrap();

