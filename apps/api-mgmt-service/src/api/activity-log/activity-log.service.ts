import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createAudit(audit: Partial<AuditLog>) {
    try {
      const entity = this.auditLogRepository.create(audit as any);
      return await this.auditLogRepository.save(entity);
    } catch (err) {
      this.logger.error('Failed to save audit log', err);
      throw err;
    }
  }

  async findForUser(
    { page, limit }: { page?: number; limit?: number },
    userId?: number | string,
  ) {
    const isPaginated = page && limit;

    const where = { actor_id: String(userId) } as any;

    if (!isPaginated) {
      return await this.auditLogRepository.find({
        where,
        order: { timestamp: 'DESC' },
      });
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip,
      take,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: logs,
      meta: { page, totalPages, totalItems: total },
    };
  }
}
