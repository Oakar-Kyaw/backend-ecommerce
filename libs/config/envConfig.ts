
import { ConfigModule } from '@nestjs/config';

export const GlobalConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
});

export const envConfig =  () => ({
    environment: process.env.ENVIRONMENT || 'development',
    redis_url: process.env.REDIS_URL,
    redis_port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    redis_host: process.env.REDIS_HOST ?? 'localhost',
    user_service_port: parseInt(process.env.USER_SERVER_PORT ?? '5001', 10),
    user_service_url: process.env.USER_SERVER_URL ?? "http://localhost:4000/api/v1",
    user_service_tcp: parseInt(process.env.USER_SERVER_TCP ?? '5002', 10),
    auth_service_port: parseInt(process.env.AUTH_SERVER_PORT ?? '5003', 10),
    auth_service_url: process.env.AUTH_SERVER_URL ?? "http://localhost:5000/api/v1",
    auth_service_tcp: parseInt(process.env.AUTH_SERVER_TCP ?? '5004', 10),
    auth_service_db: process.env.AUTH_DB_URL,
    noti_service_port: parseInt(process.env.NOTIFICATION_SERVER_PORT ?? '5005', 10),
    noti_service_tcp: parseInt(process.env.NOTIFICATION_SERVER_TCP ?? '5006', 10),
    chat_service_port: parseInt(process.env.CHAT_SERVER_TCP ?? '5007', 10),
    chat_gateway_port: parseInt(process.env.CHAT_GATEWAY_PORT ?? '5008', 10),
    JWTRefreshSecret: process.env.JWT_REFRESH_SECRET,
    firebase_projectId: process.env.FIREBASE_PROJECT_ID,
    firebase_clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    firebase_privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    smtp_host: process.env.SMTP_HOST,
    smtp_port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    smtp_user: process.env.SMTP_USER,
    smtp_pass: process.env.SMTP_PASS,
    JWTSecret: process.env.JWT_SECRET,
    //google auth
    GOOGLE_CLIENTID: process.env.GOOGLE_CLIENTID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_USER_CALLBACK_URL: process.env.GOOGLE_USER_CALLBACK_URL,
    GOOGLE_AUTH_CALLBACK_URL: process.env.GOOGLE_AUTH_CALLBACK_URL,
    GOOGLE_TOKEN_URL: process.env.GOOGLE_TOKEN_URL,
    GOOGLE_AUTH_URL: process.env.GOOGLE_AUTH_URL,
    //facebook auth
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    FACEBOOK_USER_CALLBACK_URL: process.env.FACEBOOK_USER_CALLBACK_URL,
    FACEBOOK_AUTH_CALLBACK_URL: process.env.FACEBOOK_AUTH_CALLBACK_URL,
    database: {
        port: parseInt(process.env.DATABASE_PORT ?? '5432', 10)
    }

});
