import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async createAudit(payload: unknown): Promise<void> {
    try {
      const url =
        process.env.API_MGMT_BASE_URL ||
        'http://api-mgmt-service:3000/api/activity/internal';
      // best-effort POST to API Mgmt activity endpoint.
      // Use globalThis.fetch if available; swallow errors so logging is non-blocking.
      // Avoid using `any` so ESLint/tsc rules are satisfied — perform a safe
      // runtime type check, then narrow to a typed function before calling.
      type FetchType = (
        input: string,
        init?: {
          method?: string;
          headers?: Record<string, string>;
          body?: string;
        },
      ) => Promise<unknown>;

      const maybeFetch = (globalThis as unknown as { fetch?: unknown }).fetch;

      if (typeof maybeFetch === 'function') {
        const fetchFn = maybeFetch as FetchType;
        await fetchFn(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload || {}),
        });
      } else {
        // fetch not available in runtime - skip and log
        this.logger.debug('fetch not available; skip sending audit');
      }
    } catch (err: unknown) {
      // Log the error (do not throw) because audit is best-effort
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn('Failed to post audit to api-mgmt-service: ' + msg);
    }
  }
}
