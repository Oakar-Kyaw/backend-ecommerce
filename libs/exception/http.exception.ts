import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.log("ec",exception)
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let messages: string[] = [];
    console.log("exception", exception)
    //  if (exception instanceof NotFoundException) {
    //   messages = [
    //     `No API route found for ${request.method} ${request.url}`,
    //   ];
    // }
    // else
       if (exception instanceof HttpException) {
      const res = exception.getResponse();
      console.log("res ", res)
      if (typeof res === 'string') {
        messages = [res];
      } else if (Array.isArray((res as any).message)) {
        messages = (res as any).message;
      } else if (typeof (res as any).message === 'string') {
        messages = [(res as any).message === "Unexpected end of JSON input" ? "Check Your Payload JSON Input" : (res as any).message];
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

    response.status(status).json({
      success: false,
      error: messages,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
