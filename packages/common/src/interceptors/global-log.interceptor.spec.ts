import { of, throwError } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GlobalLogInterceptor } from './global-log.interceptor';
import { AuditEvent } from '../types/audit-log.types';

function createHttpContext(req: Request, res: Response): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

function mockRes(statusCode = 200): Response {
  return {
    statusCode,
    write: jest.fn().mockReturnValue(true),
    end: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('GlobalLogInterceptor', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('does not block the request flow on successful dispatch', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true } as unknown as Response);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const interceptor = new GlobalLogInterceptor({
      auditServiceUrl: 'http://audit-log-service:3000',
      timeoutMs: 50,
      mapEvent: () => AuditEvent.ADMIN_ACTION,
    });

    const req = {
      method: 'GET',
      url: '/api/auth/me',
      originalUrl: '/api/auth/me',
      ip: '127.0.0.1',
      header: (name: string) => (name === 'user-agent' ? 'jest' : undefined),
      user: { id: 123 },
    } as unknown as Request;

    const res = mockRes(200);
    const ctx = createHttpContext(req, res);
    const next: CallHandler = { handle: () => of({ ok: true }) };

    const result = await new Promise<unknown>((resolve, reject) => {
      interceptor
        .intercept(ctx, next)
        .subscribe({ next: resolve, error: reject });
    });

    expect(result).toEqual({ ok: true });
    // Give the async dispatch a tick to complete.
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchMock).toHaveBeenCalled();
  });

  it('continues working even if the audit service is down', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('down'));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const interceptor = new GlobalLogInterceptor({
      auditServiceUrl: 'http://audit-log-service:3000',
      timeoutMs: 50,
      mapEvent: () => AuditEvent.LOGIN,
    });

    const req = {
      method: 'POST',
      url: '/api/auth/login',
      originalUrl: '/api/auth/login',
      ip: '127.0.0.1',
      header: () => undefined,
      user: { id: 'u1' },
    } as unknown as Request;
    const res = mockRes(201);

    const ctx = createHttpContext(req, res);
    const next: CallHandler = { handle: () => of('OK') };

    const result = await new Promise<unknown>((resolve, reject) => {
      interceptor
        .intercept(ctx, next)
        .subscribe({ next: resolve, error: reject });
    });

    expect(result).toBe('OK');
  });

  it('logs error responses but does not swallow controller errors', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true } as unknown as Response);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const interceptor = new GlobalLogInterceptor({
      auditServiceUrl: 'http://audit-log-service:3000',
      timeoutMs: 50,
    });

    const req = {
      method: 'GET',
      url: '/api/payment/fail',
      originalUrl: '/api/payment/fail',
      ip: '127.0.0.1',
      header: () => undefined,
    } as unknown as Request;
    const res = mockRes(200);

    const ctx = createHttpContext(req, res);
    const next: CallHandler = {
      handle: () => throwError(() => ({ statusCode: 503 })),
    };

    await expect(
      new Promise((resolve, reject) => {
        interceptor
          .intercept(ctx, next)
          .subscribe({ next: resolve, error: reject });
      }),
    ).rejects.toBeDefined();

    await new Promise((r) => setTimeout(r, 10));
    expect(fetchMock).toHaveBeenCalled();
  });
});
