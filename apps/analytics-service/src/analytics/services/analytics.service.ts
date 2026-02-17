import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiRequestLog } from '../entities/api-request-log.entity';

interface TimeGraphRow {
  date: string;
  calls: string;
}

interface LatencyGraphRow {
  date: string;
  latencyMs: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ApiRequestLog)
    private readonly logRepository: Repository<ApiRequestLog>,
  ) {}

  async logRequest(data: Partial<ApiRequestLog>): Promise<void> {
    await this.logRepository.save(data);
  }

  async getDailyStats() {
    // Basic aggregation logic
    // In a real scenario, use more complex SQL queries or timescaledb
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalApiHitsToday = await this.logRepository
      .createQueryBuilder('log')
      .where('log.timestamp >= :today', { today })
      .getCount();

    const totalSuccessHits = await this.logRepository
      .createQueryBuilder('log')
      .where('log.timestamp >= :today', { today })
      .andWhere('log.status_code >= 200')
      .andWhere('log.status_code < 400')
      .getCount();

    const totalErrorHits = totalApiHitsToday - totalSuccessHits;

    // Placeholder for other stats
    return {
      totalApiHitsToday: {
        value: totalApiHitsToday,
        percentage: 0, // Calculate change vs yesterday if needed
        change: 'stable',
        period: 'daily',
      },
      totalSuccessHits,
      totalErrorHits,
    };
  }

  async getTimeGraph(startDate?: string, endDate?: string) {
    const query = this.logRepository
      .createQueryBuilder('log')
      .select("TO_CHAR(log.timestamp, 'Mon DD')", 'date')
      .addSelect('COUNT(*)', 'calls')
      .groupBy("TO_CHAR(log.timestamp, 'Mon DD'), DATE(log.timestamp)")
      .orderBy('DATE(log.timestamp)', 'ASC');

    if (startDate) {
      query.andWhere('log.timestamp >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('log.timestamp <= :endDate', { endDate });
    }

    const result = await query.getRawMany<TimeGraphRow>();
    return result.map((r) => ({ date: r.date, calls: Number(r.calls) }));
  }

  async getLatencyGraph(startDate?: string, endDate?: string) {
    const query = this.logRepository
      .createQueryBuilder('log')
      .select("TO_CHAR(log.timestamp, 'Mon DD')", 'date')
      .addSelect('AVG(log.duration_ms)', 'latencyMs')
      .groupBy("TO_CHAR(log.timestamp, 'Mon DD'), DATE(log.timestamp)")
      .orderBy('DATE(log.timestamp)', 'ASC');

    if (startDate) {
      query.andWhere('log.timestamp >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('log.timestamp <= :endDate', { endDate });
    }

    const result = await query.getRawMany<LatencyGraphRow>();
    return result.map((r) => ({
      date: r.date,
      latencyMs: Number(r.latencyMs),
    }));
  }

  /**
   * System-wide uptime/health statistics for given date range.
   */
  async getSystemHealth(startDate?: string, endDate?: string) {
    const qb = this.logRepository.createQueryBuilder('log');

    qb.select('COUNT(*)', 'total');
    qb.addSelect(
      'SUM(CASE WHEN log.status_code >= 200 AND log.status_code < 400 THEN 1 ELSE 0 END)',
      'success',
    );
    qb.addSelect(
      'SUM(CASE WHEN log.status_code >= 500 THEN 1 ELSE 0 END)',
      'errors',
    );
    qb.addSelect('AVG(log.duration_ms)', 'avgLatency');

    if (startDate) qb.andWhere('log.timestamp >= :startDate', { startDate });
    if (endDate) qb.andWhere('log.timestamp <= :endDate', { endDate });

    const row = await qb.getRawOne<{
      total?: string;
      success?: string;
      errors?: string;
      avgLatency?: string;
    }>();

    const total = row?.total ? Number(row.total) : 0;
    const success = row?.success ? Number(row.success) : 0;
    const errors = row?.errors ? Number(row.errors) : 0;
    const avgLatency = row?.avgLatency ? Number(row.avgLatency) : 0;

    const successRate =
      total > 0 ? Number(((success / total) * 100).toFixed(2)) : 0;
    const errorRate =
      total > 0 ? Number(((errors / total) * 100).toFixed(2)) : 0;

    return {
      total,
      success,
      errors,
      avgLatency,
      successRate,
      errorRate,
      uptimePct: successRate,
      downtimePct: Number((100 - successRate).toFixed(2)),
    };
  }

  /**
   * API-wise health / error statistics grouped by request path.
   */
  async getApiHealth(startDate?: string, endDate?: string) {
    const qb = this.logRepository.createQueryBuilder('log');

    qb.select('log.path', 'path');
    qb.addSelect('COUNT(*)', 'total');
    qb.addSelect(
      'SUM(CASE WHEN log.status_code >= 200 AND log.status_code < 400 THEN 1 ELSE 0 END)',
      'success',
    );
    qb.addSelect(
      'SUM(CASE WHEN log.status_code >= 500 THEN 1 ELSE 0 END)',
      'errors',
    );
    qb.addSelect('AVG(log.duration_ms)', 'avgLatency');

    if (startDate) qb.andWhere('log.timestamp >= :startDate', { startDate });
    if (endDate) qb.andWhere('log.timestamp <= :endDate', { endDate });

    qb.groupBy('log.path');
    qb.orderBy('total', 'DESC');

    const rows = await qb.getRawMany<{
      path: string;
      total?: string;
      success?: string;
      errors?: string;
      avgLatency?: string;
    }>();

    return rows.map((r) => {
      const total = r.total ? Number(r.total) : 0;
      const success = r.success ? Number(r.success) : 0;
      const errors = r.errors ? Number(r.errors) : 0;
      const avgLatency = r.avgLatency ? Number(r.avgLatency) : 0;
      const successRate =
        total > 0 ? Number(((success / total) * 100).toFixed(2)) : 0;
      const errorRate =
        total > 0 ? Number(((errors / total) * 100).toFixed(2)) : 0;
      return {
        path: r.path,
        total,
        success,
        errors,
        avgLatency,
        successRate,
        errorRate,
      };
    });
  }
}
