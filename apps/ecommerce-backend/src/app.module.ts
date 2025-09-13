import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'libs/config/envConfig';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: envConfig().auth_service_port,
        },
      },
      {
        name: 'USER',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: envConfig().user_service_port,
        },
      },
  ])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
