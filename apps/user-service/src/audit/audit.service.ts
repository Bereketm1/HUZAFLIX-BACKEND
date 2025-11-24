import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async createAudit(payload: any): Promise<void> {
    try {
      const url = process.env.API_MGMT_BASE_URL || 'http://api-mgmt-service:3000/api/activity/internal';
      // best-effort POST to API Mgmt activity endpoint.
      // Use global fetch if available; swallow errors so logging is non-blocking.
      if (typeof (global as any).fetch === 'function') {
        await (global as any).fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload || {}),
        });
      } else {
        // fetch not available in runtime - skip and log
        this.logger.debug('fetch not available; skip sending audit');
      }
    } catch (err) {
      this.logger.error('Failed to post audit to api-mgmt-service', (err as Error).message);
    }
  }
}
