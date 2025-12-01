import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type FindOptionsWhere } from 'typeorm';
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
    const src = audit;
    if (src && typeof src === 'object') {
      const createDTO = src as CreateAuditLogDto;
      if ('actor_id' in src && createDTO.actor_id !== undefined) {
        normalized.actor_id = String(createDTO.actor_id);
      }
      if ('event' in src && createDTO.event !== undefined) {
        normalized.event = createDTO.event;
      }
      if ('resource_type' in src && createDTO.resource_type !== undefined) {
        normalized.resource_type = String(createDTO.resource_type);
      }
      if ('resource_id' in src && createDTO.resource_id !== undefined) {
        normalized.resource_id = String(createDTO.resource_id);
      }
      if ('metadata' in src && createDTO.metadata !== undefined) {
        normalized.metadata = createDTO.metadata;
      }
      if ('ip_address' in src && createDTO.ip_address !== undefined) {
        normalized.ip_address = String(createDTO.ip_address);
      }
      if ('user_agent' in src && createDTO.user_agent !== undefined) {
        normalized.user_agent = String(createDTO.user_agent);
      }
    }

    try {
      const entity = this.auditLogRepository.create(normalized);
      return await this.auditLogRepository.save(entity);
    } catch (err: unknown) {
      // Log and rethrow — preserve original error typing
      this.logger.error(
        'Failed to save audit log',
        err instanceof Error ? err.message : String(err),
      );
      throw err;
    }
  }

  async findForUser(
    { page, limit }: { page?: number; limit?: number },
    userId?: number | string,
  ) {
    const isPaginated = page && limit;

    const where: FindOptionsWhere<AuditLog> = { actor_id: String(userId) };

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
