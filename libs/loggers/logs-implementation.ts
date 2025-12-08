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

    const geo = geoip.lookup(ip);

    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();

    const start = Date.now();

    // Capture errors thrown during request processing
    let errorMessage = null;
    const originalEnd = res.end;
    res.end = function (...args) {
      try {
        return originalEnd.apply(this, args);
      } catch (err: any) {
        errorMessage = err.message || 'Unknown error';
        throw err;
      }
    };

    res.on('finish', () => {
      // Determine log level based on status code
      let logLevel: 'INFO' | 'WARN' | 'ERROR';
      if (res.statusCode >= 500) logLevel = 'ERROR';
      else if (res.statusCode >= 400) logLevel = 'WARN';
      else logLevel = 'INFO';

      const log = {
        time: new Date().toISOString(),
        level: logLevel,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: Date.now() - start + 'ms',
        error: errorMessage,
        ip,
        country: geo?.country || 'Unknown',
        city: geo?.city || 'Unknown',
        browser: ua.browser.name || 'Unknown',
        os: ua.os.name || 'Unknown',
        device: ua.device.type || 'Desktop',
        service: process.env.SERVICE_NAME || 'nestjs', // optional: identify service
      };

      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, 'requests.log');

      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Write to console for local colorized view
      if (logLevel === 'ERROR') console.error(log);
      else if (logLevel === 'WARN') console.warn(log);
      else console.log(log);

      // Append JSON log to file (Promtail will read this)
      fs.appendFileSync(logFile, JSON.stringify(log) + '\n');
    });

    next();
  }
}
