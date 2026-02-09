import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IncomingMessage } from 'http';

@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  constructor(
    @Inject('ANALYTICS_SERVICE') private readonly analyticsClient: ClientProxy,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<IncomingMessage & { user?: any }>();

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logRequest(request, context, start, 200); // Assume 200 for successful completion if not available
        },
        error: (error) => {
          const status = error.status || 500;
          this.logRequest(request, context, start, status);
        },
      }),
    );
  }

  private logRequest(
    request: IncomingMessage & { user?: any; url?: string; method?: string },
    context: ExecutionContext,
    startTime: number,
    status: number,
  ) {
    const duration = Date.now() - startTime;
    // Extract API Key if present (custom header or query param as used in ApiUsageService)
    // For now, we'll try to get it from headers 'x-api-key'
    const apiKey = request.headers['x-api-key'] as string;

    // User might be attached by AuthGuard
    const userId = request.user?.id;

    const logData = {
      api_key: apiKey || null,
      path: request.url,
      method: request.method,
      status_code: status,
      duration_ms: duration,
      user_id: userId || null,
      timestamp: new Date(),
    };

    this.analyticsClient.emit('log_api_request', logData);
  }
}
