import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditEvent, paginate, PaginatedResponse } from '@huzaflix/common';
import { Repository } from 'typeorm';
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
      qb.andWhere("l.metadata->>'userId' = :userId", { userId: filter.userId });
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
}
