import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

@Injectable()
export class UsageGuard implements CanActivate {
  private readonly logger = new Logger(UsageGuard.name);

  constructor(
    @Inject('API_MGMT_SERVICE') private readonly client: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[]>;
      url: string;
    }>();
    const apiKey = req.headers['x-api-key'] as string;
    const path = req.url;

    try {
      const result = (await lastValueFrom(
        this.client
          .send('validate_request', { apiKey, path })
          .pipe(timeout(5000)),
      )) as { allowed: boolean; reason?: string };

      if (!result.allowed) {
        throw new HttpException(
          result.reason || 'Forbidden',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;

      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Usage validation failed: ${message}`);
      // Fail closed for security/billing enforcement
      throw new HttpException(
        'Service Unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
