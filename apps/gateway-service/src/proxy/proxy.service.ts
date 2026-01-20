import { Injectable } from '@nestjs/common';
import type { ClientRequest } from 'http';
import {
  createProxyMiddleware,
  type RequestHandler,
} from 'http-proxy-middleware';

type ProxyKey =
  | 'auth'
  | 'analytics'
  | 'api-management'
  | 'payment'
  | 'audit-log';

function writeParsedBodyToProxyReq(
  proxyReq: ClientRequest,
  req: Parameters<RequestHandler>[0],
): void {
  const reqWithBody = req as unknown as { body?: unknown; headers?: unknown };

  const body = reqWithBody.body;
  if (body === undefined || body === null) return;

  let bodyData: Buffer | string | undefined;

  if (Buffer.isBuffer(body)) {
    bodyData = body;
  } else if (typeof body === 'string') {
    bodyData = body;
  } else if (typeof body === 'object') {
    bodyData = JSON.stringify(body);
    if (!proxyReq.getHeader('Content-Type')) {
      proxyReq.setHeader('Content-Type', 'application/json');
    }
  } else {
    return;
  }

  const contentLength =
    typeof bodyData === 'string'
      ? Buffer.byteLength(bodyData)
      : bodyData.length;

  proxyReq.setHeader('Content-Length', contentLength);
  proxyReq.write(bodyData);
}

@Injectable()
export class ProxyService {
  private readonly proxies: Record<ProxyKey, RequestHandler>;

  constructor() {
    this.proxies = {
      auth: createProxyMiddleware({
        target: `http://user-service:${process.env.USER_SERVICE_PORT || 3000}`,
        changeOrigin: true,
        pathRewrite: (path) => path.replace(/^\/api\/auth(?=\/|$)/, ''),
        on: {
          proxyReq: (proxyReq, req) =>
            writeParsedBodyToProxyReq(
              proxyReq as unknown as ClientRequest,
              req,
            ),
        },
        timeout: 15_000,
        proxyTimeout: 15_000,
      }),
      analytics: createProxyMiddleware({
        target: `http://analytics-service:${process.env.ANALYTICS_SERVICE_PORT || 3000}`,
        changeOrigin: true,
        pathRewrite: (path) => path.replace(/^\/api\/analytics(?=\/|$)/, ''),
        on: {
          proxyReq: (proxyReq, req) =>
            writeParsedBodyToProxyReq(
              proxyReq as unknown as ClientRequest,
              req,
            ),
        },
        timeout: 15_000,
        proxyTimeout: 15_000,
      }),
      'api-management': createProxyMiddleware({
        target: `http://api-mgmt-service:${process.env.API_MANAGEMENT_SERVICE_PORT || 3000}`,
        changeOrigin: true,
        pathRewrite: (path) =>
          path.replace(/^\/api\/api-management(?=\/|$)/, ''),
        on: {
          proxyReq: (proxyReq, req) =>
            writeParsedBodyToProxyReq(
              proxyReq as unknown as ClientRequest,
              req,
            ),
        },
        timeout: 15_000,
        proxyTimeout: 15_000,
      }),
      payment: createProxyMiddleware({
        target: `http://payment-service:${process.env.PAYMENT_SERVICE_PORT || 3000}`,
        changeOrigin: true,
        pathRewrite: (path) => path.replace(/^\/api\/payment(?=\/|$)/, ''),
        on: {
          proxyReq: (proxyReq, req) =>
            writeParsedBodyToProxyReq(
              proxyReq as unknown as ClientRequest,
              req,
            ),
        },
        timeout: 15_000,
        proxyTimeout: 15_000,
      }),
      'audit-log': createProxyMiddleware({
        target: `http://audit-log-service:${process.env.AUDIT_LOG_SERVICE_PORT || 3000}`,
        changeOrigin: true,
        pathRewrite: (path) => path.replace(/^\/api\/audit-log(?=\/|$)/, ''),
        on: {
          proxyReq: (proxyReq, req) =>
            writeParsedBodyToProxyReq(
              proxyReq as unknown as ClientRequest,
              req,
            ),
        },
        timeout: 15_000,
        proxyTimeout: 15_000,
      }),
    };
  }

  async forward(
    key: ProxyKey,
    req: Parameters<RequestHandler>[0],
    res: Parameters<RequestHandler>[1],
  ): Promise<void> {
    const middleware = this.proxies[key];

    await new Promise<void>((resolve, reject) => {
      const done = () => {
        cleanup();
        resolve();
      };

      const onError = (err: unknown) => {
        cleanup();

        // When the upstream is temporarily unavailable (common right after restarts),
        // ensure we always terminate the response instead of hanging until client timeout.
        if (!res.headersSent) {
          res.statusCode = 502;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ message: 'Bad Gateway' }));
        } else if (!res.writableEnded) {
          res.end();
        }

        reject(err instanceof Error ? err : new Error(String(err)));
      };

      const cleanup = () => {
        res.removeListener('finish', done);
        res.removeListener('close', done);
      };

      res.once('finish', done);
      res.once('close', done);

      try {
        void middleware(req, res, onError);
      } catch (err: unknown) {
        onError(err);
      }
    });
  }
}
