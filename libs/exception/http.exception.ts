import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { throwError } from 'rxjs';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Determine request type
    const type = host.getType();

    let messages: string[] = [];

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        messages = [res];
      } else if (Array.isArray((res as any).message)) {
        messages = (res as any).message;
      } else if (typeof (res as any).message === 'string') {
        messages = [(res as any).message];
      } else {
        messages = [JSON.stringify(res)];
      }
    } else if (exception instanceof Error) {
      messages = [exception.message];
    } else {
      messages = ['Internal server error'];
    }
    console.log("excepton", exception, type)
    // Optional: log full error in dev
    if (process.env.NODE_ENV !== 'production') {
      console.error(exception);
    }

    if (type === 'http') {
      // HTTP response
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      response.status(
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR,
      ).json({
        success: false,
        error: messages,
        data: null,
        timestamp: new Date().toISOString(),
      });
    } else if (type === 'rpc') {
      // TCP / microservice response
      return throwError(() => ({
        success: false,
        error: messages,
        data: null,
        timestamp: new Date().toISOString(),
      }));
    }
  }
}
