import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class IngestApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expected = process.env.AUDIT_LOG_INGEST_KEY;
    if (!expected) return true;

    const provided = req.header('x-audit-key');
    return (
      typeof provided === 'string' &&
      provided.length > 0 &&
      provided === expected
    );
  }
}
