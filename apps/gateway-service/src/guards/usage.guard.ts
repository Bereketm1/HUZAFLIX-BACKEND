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
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'];
    const path = req.url;

    try {
      const result = await lastValueFrom(
        this.client
          .send('validate_request', { apiKey, path })
          .pipe(timeout(5000)),
      );

      if (!result.allowed) {
        throw new HttpException(
          result.reason || 'Forbidden',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (err) {
      if (err instanceof HttpException) throw err;

      this.logger.error(`Usage validation failed: ${err.message}`);
      // Fail closed for security/billing enforcement
      throw new HttpException(
        'Service Unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
