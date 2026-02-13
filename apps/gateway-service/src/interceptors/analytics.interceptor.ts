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

interface AuthenticatedUser {
  id: number;
  [key: string]: unknown;
}

interface AuthenticatedRequest extends IncomingMessage {
  user?: AuthenticatedUser;
  url?: string;
  method?: string;
}

interface HttpError {
  status?: number;
  message?: string;
}

interface ApiLogData {
  api_key: string | null;
  path: string | undefined;
  method: string | undefined;
  status_code: number;
  duration_ms: number;
  user_id: number | null;
  timestamp: Date;
}

@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  constructor(
    @Inject('ANALYTICS_SERVICE') private readonly analyticsClient: ClientProxy,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<AuthenticatedRequest>();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logRequest(request, start, 200);
        },
        error: (error: HttpError) => {
          const status = typeof error?.status === 'number' ? error.status : 500;
          this.logRequest(request, start, status);
        },
      }),
    );
  }

  private logRequest(
    request: AuthenticatedRequest,
    startTime: number,
    status: number,
  ) {
    const duration = Date.now() - startTime;
    const apiKey = (request.headers['x-api-key'] as string) || null;
    const userId = request.user?.id ?? null;

    const logData: ApiLogData = {
      api_key: apiKey,
      path: request.url,
      method: request.method,
      status_code: status,
      duration_ms: duration,
      user_id: userId,
      timestamp: new Date(),
    };

    this.analyticsClient.emit('log_api_request', logData);
  }
}
