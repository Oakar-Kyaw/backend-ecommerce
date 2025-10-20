import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from 'libs/config/envConfig';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER',
        transport: Transport.TCP,
        //for local
        options: { host: 'localhost', port: envConfig().user_service_tcp }, // user service port
       //options: { host: 'user', port: envConfig().user_service_tcp }, 
      },
    ]),
    JwtModule.register({
      global: true,
      secret: envConfig().JWTSecret,
      //for production
      signOptions: { expiresIn: '900s' },
    }),],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
