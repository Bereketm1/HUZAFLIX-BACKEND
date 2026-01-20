import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expected = process.env.AUDIT_LOG_ADMIN_KEY;
    if (!expected) return false;

    const provided = req.header('x-admin-key');
    return (
      typeof provided === 'string' &&
      provided.length > 0 &&
      provided === expected
    );
  }
}
