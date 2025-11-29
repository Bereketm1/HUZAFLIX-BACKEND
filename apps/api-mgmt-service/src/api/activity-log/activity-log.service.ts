import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import type { DeepPartial } from 'typeorm';
import type { CreateAuditLogDto } from '../dto/audit-log/create-audit-log.dto';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createAudit(audit: CreateAuditLogDto | DeepPartial<AuditLog>) {
    // Normalize incoming payload to a DeepPartial<AuditLog> with safe types
    const normalized: DeepPartial<AuditLog> = {};

    if ('actor_id' in audit && audit.actor_id !== undefined) {
      normalized.actor_id = String((audit as any).actor_id);
    }
    if ('event' in audit && (audit as any).event !== undefined) {
      normalized.event = (audit as any).event as AuditLog['event'];
    }
    if ('resource_type' in audit && (audit as any).resource_type !== undefined) {
      normalized.resource_type = String((audit as any).resource_type);
    }
    if ('resource_id' in audit && (audit as any).resource_id !== undefined) {
      normalized.resource_id = String((audit as any).resource_id);
    }
    if ('metadata' in audit && (audit as any).metadata !== undefined) {
      normalized.metadata = (audit as any).metadata as Record<string, unknown>;
    }
    if ('ip_address' in audit && (audit as any).ip_address !== undefined) {
      normalized.ip_address = String((audit as any).ip_address);
    }
    if ('user_agent' in audit && (audit as any).user_agent !== undefined) {
      normalized.user_agent = String((audit as any).user_agent);
    }

    try {
      const entity = this.auditLogRepository.create(normalized);
      return await this.auditLogRepository.save(entity);
    } catch (err: unknown) {
      // Log and rethrow — preserve original error typing
      this.logger.error('Failed to save audit log', err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async findForUser(
    { page, limit }: { page?: number; limit?: number },
    userId?: number | string,
  ) {
    const isPaginated = page && limit;

    const where: Partial<AuditLog> = { actor_id: String(userId) };

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
