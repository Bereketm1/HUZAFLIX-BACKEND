import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiRequestLog } from '../entities/api-request-log.entity';

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
      .orderBy("DATE(log.timestamp)", 'ASC');

    if (startDate) {
        query.andWhere('log.timestamp >= :startDate', { startDate });
    }
    if (endDate) {
        query.andWhere('log.timestamp <= :endDate', { endDate });
    }

    const result = await query.getRawMany();
    return result.map(r => ({ date: r.date, calls: Number(r.calls) }));
  }

  async getLatencyGraph(startDate?: string, endDate?: string) {
     const query = this.logRepository
      .createQueryBuilder('log')
      .select("TO_CHAR(log.timestamp, 'Mon DD')", 'date')
      .addSelect('AVG(log.duration_ms)', 'latencyMs')
      .groupBy("TO_CHAR(log.timestamp, 'Mon DD'), DATE(log.timestamp)")
      .orderBy("DATE(log.timestamp)", 'ASC');
      
    if (startDate) {
        query.andWhere('log.timestamp >= :startDate', { startDate });
    }
    if (endDate) {
        query.andWhere('log.timestamp <= :endDate', { endDate });
    }

    const result = await query.getRawMany();
    return result.map(r => ({ date: r.date, latencyMs: Number(r.latencyMs) }));
  }
}
