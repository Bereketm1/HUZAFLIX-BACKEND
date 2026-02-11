import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export type UptimeStats = {
  basePath: string;
  startDate?: string;
  endDate?: string;
  total: number;
  success: number;
  uptimePct: number;
};

@Injectable()
export class AuditLogClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseUrl =
      process.env.AUDIT_LOG_SERVICE_URL || 'http://audit-log-service:3000';
    this.timeoutMs = Number(process.env.AUDIT_LOG_TIMEOUT_MS || 1500);
  }

  async getUptimeStats(
    basePath: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UptimeStats> {
    const params = new URLSearchParams({ basePath });
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());

    const url = `${this.baseUrl.replace(/\/$/, '')}/uptime?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ServiceUnavailableException(
          `Audit log service responded with ${response.status}`,
        );
      }

      const data = (await response.json()) as UptimeStats;
      return {
        basePath: data.basePath,
        startDate: data.startDate,
        endDate: data.endDate,
        total: Number(data.total) || 0,
        success: Number(data.success) || 0,
        uptimePct: Number(data.uptimePct) || 0,
      };
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('Audit log service unavailable');
    } finally {
      clearTimeout(timer);
    }
  }
}
