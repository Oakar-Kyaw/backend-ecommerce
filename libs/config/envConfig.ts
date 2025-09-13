
import { ConfigModule } from '@nestjs/config';

export const GlobalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
});

export const envConfig =  () => ({
    user_service_port: parseInt(process.env.USER_SERVER_PORT ?? '3000', 10),
    user_service_url: process.env.USER_SERVER_URL ?? "http://localhost:4000/api/v1",
    user_service_tcp: parseInt(process.env.USER_SERVER_TCP ?? '5002', 10),
    auth_service_port: parseInt(process.env.AUTH_SERVER_PORT ?? '5000', 10),
    auth_service_url: process.env.AUTH_SERVER_URL ?? "http://localhost:5000/api/v1",
    auth_service_tcp: parseInt(process.env.AUTH_SERVER_TCP ?? '5004', 10),
    JWTRefreshSecret: process.env.JWT_REFRESH_SECRET,
    JWTSecret: process.env.JWT_SECRET,
    database: {
        port: parseInt(process.env.DATABASE_PORT ?? '5432', 10)
    }

});
