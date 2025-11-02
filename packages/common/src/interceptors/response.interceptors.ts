import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/response.dto';
import { Response, Request } from 'express';

@Injectable()
export class ResponseInterceptor
  implements NestInterceptor<unknown, ApiResponse>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiResponse> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // ❌ Exclude /metrics endpoint
    if (request.url === '/metrics') {
      return next.handle() as Observable<ApiResponse>;
    }

    function isObjectWithMessage(
      obj: unknown,
    ): obj is { message: string; data?: Record<string, any> } {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        'message' in obj &&
        typeof (obj as { message: string }).message === 'string'
      );
    }

    return next.handle().pipe(
      map((data: unknown): ApiResponse => {
        const statusCode = response.statusCode ?? 200;

        if (
          typeof data === 'object' &&
          data !== null &&
          'success' in data &&
          'status' in data
        ) {
          return data as ApiResponse;
        }

        let message = 'Request successful';
        let responseData: Record<string, any> | null = null;

        if (isObjectWithMessage(data)) {
          message = data.message;
          responseData = data;
        } else if (typeof data === 'object' && data !== null) {
          responseData = data as Record<string, any>;
        } else {
          responseData = { value: data };
        }

        return new ApiResponse(
          statusCode >= 200 && statusCode < 300,
          statusCode,
          message,
          responseData || { data: null },
        );
      }),
    );
  }
}
