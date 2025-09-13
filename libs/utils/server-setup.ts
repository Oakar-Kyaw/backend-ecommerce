import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { HttpExceptionFilter } from "libs/exception/http.exception";

export default function serversetup(app, port){
  //for all undefined routes and custom http exception
  app.useGlobalFilters(
    new HttpExceptionFilter()
  );
  // global exception error and non property field error
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,      
      forbidNonWhitelisted: true,  
      transform: true,
      errorHttpStatusCode: 400,
      exceptionFactory: (validationErrors) => {
        const messages = validationErrors.flatMap(error =>
          Object.values(error.constraints ?? {})
        );
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