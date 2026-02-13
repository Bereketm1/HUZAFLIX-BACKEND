import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditEvent, paginate, PaginatedResponse } from '@huzaflix/common';
import { Brackets, Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import type { CreateLogDto } from './dto/create-log.dto';

export type LogsFilter = {
  eventType?: AuditEvent;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
};

export type UptimeStats = {
  basePath: string;
  startDate?: string;
  endDate?: string;
  total: number;
  success: number;
  uptimePct: number;
};

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async create(dto: CreateLogDto): Promise<AuditLog> {
    const entity = this.repo.create({
      actor: dto.actor,
      event: dto.event,
      status: dto.status,
      ipAddress: dto.ipAddress ?? null,
      metadata: dto.metadata ?? null,
      // timestamp is immutable; if provided, use it as created timestamp.
      ...(dto.timestamp ? { timestamp: new Date(dto.timestamp) } : {}),
    });
    return await this.repo.save(entity);
  }

  async find(
    filter: LogsFilter,
  ): Promise<{ data: AuditLog[]; meta: PaginatedResponse } | AuditLog[]> {
    const qb = this.repo.createQueryBuilder('l');

    // Hide operational noise: swagger docs and viewing the audit log itself.
    qb.andWhere("COALESCE(l.metadata->>'path','') NOT LIKE :auditLogPath", {
      auditLogPath: '/api/audit-log/%',
    });
    qb.andWhere("COALESCE(l.metadata->>'path','') NOT LIKE :apiDocsPath", {
      apiDocsPath: '%/api-docs%',
    });

    if (filter.eventType) {
      qb.andWhere('l.event = :event', { event: filter.eventType });
    }

    if (filter.userId) {
      if (filter.eventType === AuditEvent.LOGIN) {
        // Login events may lack a userId (the user was not yet
        // authenticated). Include logs that match OR have no userId.
        qb.andWhere(
          new Brackets((sub) =>
            sub
              .where("l.metadata->>'userId' = :userId", {
                userId: filter.userId,
              })
              .orWhere("l.metadata->>'userId' IS NULL"),
          ),
        );
      } else {
        qb.andWhere("l.metadata->>'userId' = :userId", {
          userId: filter.userId,
        });
      }
    }

    if (filter.startDate) {
      qb.andWhere('l.timestamp >= :start', { start: filter.startDate });
    }

    if (filter.endDate) {
      qb.andWhere('l.timestamp <= :end', { end: filter.endDate });
    }

    const sort = filter.sort?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    qb.orderBy('l.timestamp', sort);

    if (filter.page && filter.limit) {
      const skip = (filter.page - 1) * filter.limit;
      const take = filter.limit;
      qb.skip(skip).take(take);

      const [logs, total] = await qb.getManyAndCount();
      return paginate(logs, filter.page, filter.limit, total);
    }

    return await qb.getMany();
  }

  async getUptimeStats(
    basePath: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UptimeStats> {
    const normalized = basePath.startsWith('/') ? basePath : `/${basePath}`;
    const apiPrefixed = normalized.startsWith('/api/')
      ? normalized
      : `/api${normalized}`;

    const qb = this.repo.createQueryBuilder('l');
    qb.select('COUNT(*)', 'total');
    qb.addSelect(
      'SUM(CASE WHEN l.status >= 200 AND l.status < 400 THEN 1 ELSE 0 END)',
      'success',
    );

    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where("COALESCE(l.metadata->>'path','') LIKE :basePath", {
            basePath: `${normalized}%`,
          })
          .orWhere("COALESCE(l.metadata->>'path','') LIKE :apiPath", {
            apiPath: `${apiPrefixed}%`,
          });
      }),
    );

    if (startDate) {
      qb.andWhere('l.timestamp >= :start', { start: startDate });
    }

    if (endDate) {
      qb.andWhere('l.timestamp <= :end', { end: endDate });
    }

    const row = (await qb.getRawOne()) as { total?: string; success?: string };
    const total = row?.total ? Number(row.total) : 0;
    const success = row?.success ? Number(row.success) : 0;
    const uptimePct = total > 0 ? Number(((success / total) * 100).toFixed(2)) : 0;

    return {
      basePath: normalized,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      total,
      success,
      uptimePct,
    };
  }
}
