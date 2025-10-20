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
      console.log("exception res: ", res, typeof res)
      if (typeof res === 'string') {
        messages = [res];
      } else if (Array.isArray((res as any).message)) {
        console.log("messge", (res as any).message)
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
    // Optional: log full error in dev
    if (process.env.NODE_ENV !== 'production') {
      console.error(exception);
    }

    if (type === 'http') {
      console.log("https ecepton", messages)
      // HTTP response
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      return response.status(
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
      console.log("rpc exception")
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
