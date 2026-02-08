import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';
import {
  AuditActor,
  AuditEvent,
  type AuditLogPayload,
} from '../types/audit-log.types';

type GlobalLogInterceptorOptions = {
  auditServiceUrl?: string;
  ingestKey?: string;
  timeoutMs?: number;
  mapEvent?: (req: Request) => AuditEvent;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getUserIdFromUser(user: unknown): string | undefined {
  if (!isRecord(user)) return undefined;
  const candidates: unknown[] = [user.id, user.userId, user.sub];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }
  return undefined;
}

function getRoleFromUser(user: unknown): string | undefined {
  if (!isRecord(user)) return undefined;
  const role = user.role;
  if (typeof role === 'string' && role.length > 0) return role;
  if (isRecord(role) && typeof role.name === 'string' && role.name.length > 0) {
    return role.name;
  }
  return undefined;
}

function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  const parts = token.split('.');
  if (parts.length < 2) return undefined;
  const payload = parts[1];
  if (!payload) return undefined;

  // JWT uses base64url encoding.
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  );
  try {
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const parsed: unknown = JSON.parse(json);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function getUserIdFromAuthHeader(authHeader: unknown): string | undefined {
  if (typeof authHeader !== 'string' || authHeader.length === 0) {
    return undefined;
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return undefined;

  const payload = decodeJwtPayload(token);
  if (!payload) return undefined;
  const candidates: unknown[] = [payload.id, payload.userId, payload.sub];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return String(candidate);
    }
  }
  return undefined;
}

function getRoleFromAuthHeader(authHeader: unknown): string | undefined {
  if (typeof authHeader !== 'string' || authHeader.length === 0) {
    return undefined;
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return undefined;

  const payload = decodeJwtPayload(token);
  if (!payload) return undefined;
  const role = payload.role;
  if (typeof role === 'string' && role.length > 0) return role;
  if (isRecord(role) && typeof role.name === 'string' && role.name.length > 0) {
    return role.name;
  }
  return undefined;
}

function getUserIdFromResponseBody(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  const tokenCandidates: unknown[] = [
    body.access_token,
    body.accessToken,
    body.token,
  ];

  for (const tokenCandidate of tokenCandidates) {
    if (typeof tokenCandidate === 'string' && tokenCandidate.length > 0) {
      const payload = decodeJwtPayload(tokenCandidate);
      if (!payload) continue;
      const candidates: unknown[] = [payload.id, payload.userId, payload.sub];
      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.length > 0) {
          return candidate;
        }
        if (typeof candidate === 'number' && Number.isFinite(candidate)) {
          return String(candidate);
        }
      }
    }
  }

  return undefined;
}

function getIpAddress(req: Request): string | undefined {
  const forwarded = req.header('x-forwarded-for');
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || undefined;
  }
  return req.ip || undefined;
}

function shouldSkipLogging(url: string): boolean {
  // Avoid self-noise and docs spam.
  if (url === '/metrics') return true;

  const lowered = url.toLowerCase();

  // Swagger/OpenAPI docs (via gateway or directly).
  if (lowered.includes('/api-docs')) return true;
  if (lowered.includes('/swagger')) return true;

  // Don't audit querying the audit log itself.
  // (Otherwise `/api/audit-log/logs` creates a log entry about viewing logs.)
  if (lowered.startsWith('/api/audit-log') || lowered.startsWith('/audit-log'))
    return true;

  return false;
}

function defaultMapEvent(req: Request): AuditEvent {
  const path = req.originalUrl || req.url;
  const lowered = path.toLowerCase();
  const method = req.method?.toUpperCase();
  const role =
    getRoleFromUser((req as Request & { user?: unknown }).user) ??
    getRoleFromAuthHeader(req.header('authorization'));
  if (
    role === 'administrator' &&
    method &&
    method !== 'GET' &&
    method !== 'HEAD' &&
    method !== 'OPTIONS'
  ) {
    return AuditEvent.ADMIN_ACTION;
  }
  if (lowered.includes('/login')) return AuditEvent.LOGIN;
  if (lowered.includes('/payment')) return AuditEvent.PAYMENT;
  if (lowered.includes('api-key') || lowered.includes('api_key')) {
    return AuditEvent.API_KEY_GEN;
  }
  if (lowered.includes('subscription')) return AuditEvent.SUB_UPDATE;

  // API management service activity that doesn't fit the specific buckets above.
  if (lowered.includes('/api-management')) return AuditEvent.API_MANAGEMENT;

  // Fallback: keep it neutral.
  return AuditEvent.REQUEST;
}

function getHttpStatusFromError(err: unknown): number {
  if (isRecord(err)) {
    const status = err.status;
    if (typeof status === 'number' && Number.isFinite(status)) return status;

    const statusCode = err.statusCode;
    if (typeof statusCode === 'number' && Number.isFinite(statusCode)) {
      return statusCode;
    }
  }
  return 500;
}

@Injectable()
export class GlobalLogInterceptor implements NestInterceptor {
  private readonly endpoint: string;
  private readonly ingestKey?: string;
  private readonly timeoutMs: number;
  private readonly mapEvent: (req: Request) => AuditEvent;

  constructor(options: GlobalLogInterceptorOptions = {}) {
    const base =
      options.auditServiceUrl ||
      process.env.AUDIT_LOG_SERVICE_URL ||
      'http://audit-log-service:3000';
    this.endpoint = `${base.replace(/\/$/, '')}/logs`;
    this.ingestKey = options.ingestKey || process.env.AUDIT_LOG_INGEST_KEY;
    this.timeoutMs = options.timeoutMs ?? 500;
    this.mapEvent = options.mapEvent ?? defaultMapEvent;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: unknown }>();
    const res = http.getResponse<Response>();

    const url = req.originalUrl || req.url;
    if (shouldSkipLogging(url)) {
      return next.handle();
    }

    const startedAt = Date.now();

    // ── Capture the response body for proxy routes that use @Res() ──
    // When a controller injects @Res(), the proxy middleware writes
    // directly to the response stream and the RxJS `tap` callback
    // receives `undefined`.  We patch write/end so we can still
    // extract tokens from the body (e.g. the JWT from a LOGIN response).
    const resChunks: Buffer[] = [];
    let capturedProxyBody: unknown;

    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);

    res.write = function (
      chunk: any,
      encOrCb?: BufferEncoding | ((err?: Error | null) => void),
      cb?: (err?: Error | null) => void,
    ): boolean {
      if (chunk != null) {
        resChunks.push(
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)),
        );
      }
      if (typeof encOrCb === 'function') return origWrite(chunk, encOrCb);
      if (encOrCb != null) return origWrite(chunk, encOrCb, cb);
      return origWrite(chunk);
    } as typeof res.write;

    res.end = function (
      chunkOrCb?: any,
      encOrCb?: BufferEncoding | (() => void),
      cb?: () => void,
    ): Response {
      if (chunkOrCb != null && typeof chunkOrCb !== 'function') {
        resChunks.push(
          Buffer.isBuffer(chunkOrCb)
            ? chunkOrCb
            : Buffer.from(String(chunkOrCb)),
        );
      }
      if (resChunks.length > 0) {
        try {
          capturedProxyBody = JSON.parse(
            Buffer.concat(resChunks).toString('utf8'),
          );
        } catch {
          /* response was not JSON — nothing to extract */
        }
      }
      if (typeof chunkOrCb === 'function') return origEnd(chunkOrCb);
      if (typeof encOrCb === 'function') return origEnd(chunkOrCb, encOrCb);
      if (encOrCb != null) return origEnd(chunkOrCb, encOrCb, cb);
      return origEnd(chunkOrCb);
    } as typeof res.end;

    const dispatch = (status: number, responseBody?: unknown) => {
      // Use the captured proxy body as fallback when RxJS body is undefined
      const effectiveBody = responseBody ?? capturedProxyBody;
      const userId =
        getUserIdFromUser(req.user) ??
        getUserIdFromAuthHeader(req.header('authorization')) ??
        getUserIdFromResponseBody(effectiveBody);
      const actor = userId ? AuditActor.User : AuditActor.System;
      const payload: AuditLogPayload = {
        timestamp: new Date().toISOString(),
        actor,
        event: this.mapEvent(req),
        status,
        ipAddress: getIpAddress(req),
        metadata: {
          method: req.method,
          path: url,
          latencyMs: Date.now() - startedAt,
          userAgent: req.header('user-agent') || undefined,
          userId,
        },
      };

      void this.send(payload);
    };

    return next.handle().pipe(
      tap((body: unknown) => dispatch(res.statusCode || 200, body)),
      catchError((err: unknown) => {
        dispatch(getHttpStatusFromError(err));
        return throwError(() => err);
      }),
    );
  }

  private async send(payload: AuditLogPayload): Promise<void> {
    if (typeof fetch !== 'function') return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      };
      if (this.ingestKey) {
        headers['x-audit-key'] = this.ingestKey;
      }

      await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch {
      // Best-effort: never impact the main request flow.
    } finally {
      clearTimeout(timer);
    }
  }
}
