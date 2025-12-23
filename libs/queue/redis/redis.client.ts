import Redis from 'ioredis';
import { envConfig } from 'libs/config/envConfig';

export const redis = new Redis({
  host: envConfig().redis_host,
  port: envConfig().redis_port, 
  password: envConfig().redis_password,
});
