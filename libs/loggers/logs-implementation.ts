import { Injectable, NestMiddleware } from '@nestjs/common';
import * as fs from 'fs';
import * as geoip from 'geoip-lite';
import path from 'path';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress;

    const geo = geoip.lookup(ip) || {};

    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();

    const start = Date.now();

    res.on('finish', () => {
      const log = {
        time: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: Date.now() - start + 'ms',

        ip,
        country: geo.country || 'Unknown',
        city: geo.city || 'Unknown',

        browser: ua.browser.name || 'Unknown',
        os: ua.os.name || 'Unknown',
        device: ua.device.type || 'Desktop',
      };
      const logDir = '/var/log/nestapp';
      const logFile = path.join(logDir, 'requests.log');

      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      console.log("logs", JSON.stringify(log))
      fs.appendFileSync(logFile, JSON.stringify(log) + '\n');
    });

    next();
  }
}
