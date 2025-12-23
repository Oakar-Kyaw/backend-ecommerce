import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionFilter } from 'libs/exception/http.exception';

export default function serversetup(app, port) {
//  console.log('app and port: ', port);
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: '*',
  });
  //for all undefined routes and custom http exception
  app.useGlobalFilters(new AllExceptionFilter());
  // global exception error and non property field error
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      errorHttpStatusCode: 400,
      exceptionFactory: (validationErrors) => {
        const formatErrors = (errors: any[]) => {
          return errors.flatMap((error) => {
            if (error.constraints) {
              return Object.values(error.constraints);
            }
            if (error.children && error.children.length > 0) {
              return formatErrors(error.children);
            }
            return [];
          });
        };
        const messages = formatErrors(validationErrors);
        console.log('messge', messages);
        return new BadRequestException(messages);
      },
    }),
  );
  const options = new DocumentBuilder()
    .setTitle('Ecommerce Backend API')
    .setDescription('API For Ecommerce Backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addServer(`http://localhost:${port}/`, 'Local environment')
    .addServer('https://xxxxx.com/', 'Staging')
    .addServer('https://xxxxx.com/', 'Production')
    .addTag('All API')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
}
