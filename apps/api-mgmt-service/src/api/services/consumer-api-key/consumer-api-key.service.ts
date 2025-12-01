import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ActivityLogService } from '../../activity-log/activity-log.service';
import { EventType } from '../../entities/audit-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import type { DeepPartial } from 'typeorm';
import { Api } from '../../entities/api.entity';
import { Logger } from '@nestjs/common';
import { CreateConsumerApiKeyDto } from '../../dto/consumer-api-key/create-consumer-api-key.dto';
import { UpdateConsumerApiKeyDto } from '../../dto/consumer-api-key/update-consumer-api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ConsumerApiKeyService {
  private readonly logger = new Logger(ConsumerApiKeyService.name);
  constructor(
    @InjectRepository(ApiKey) private repo: Repository<ApiKey>,
    private readonly activityLogService?: ActivityLogService,
  ) {}

  // Returns user-owned keys (without exposing the secret hash)
  async findAllForUser(userId: string): Promise<Omit<ApiKey, 'key_hash'>[]> {
    const keys = await this.repo.find({ where: { user_id: userId } });
    // hide sensitive key_hash before returning
    return keys.map((k) => {
      const { key_hash: _key_hash, ...safe } = k;
      void _key_hash;
      // `safe` will be inferred as Partial<ApiKey> with key_hash removed — cast
      return safe as Omit<ApiKey, 'key_hash'>;
    });
  }

  // Creates a new API key, stores hash and returns the one-time cleartext key
  async createForUser(userId: string, dto: CreateConsumerApiKeyDto) {
    // generate a key with prefix and secret value
    const prefix = crypto
      .randomBytes(6)
      .toString('hex')
      .slice(0, 8)
      .toUpperCase();
    const secret = crypto.randomBytes(24).toString('base64url');
    const publicKey = `${prefix}_${secret}`;

    const hash = crypto.createHash('sha256').update(publicKey).digest();

    const partial: DeepPartial<ApiKey> = {
      user_id: userId,
      key_hash: hash,
      key_prefix: prefix,
      name: dto.name,
      rate_limit_per_minute: dto.rate_limit_per_minute ?? 60,
      quota_daily: dto.quota_daily,
      quota_monthly: dto.quota_monthly,
      expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
      api: dto.api_id
        ? ({ id: Number(dto.api_id) } as Partial<Api>)
        : undefined,
    };

    const entity = this.repo.create(partial);

    try {
      const saved = await this.repo.save(entity);
      // Return created DB record (without hash) plus the cleartext key
      const { key_hash: _key_hash, ...safe } = saved;
      void _key_hash;
      // create an audit entry (best effort)
      try {
        await this.activityLogService?.createAudit({
          actor_id: String(userId),
          event: EventType.API_KEY_CREATED,
          resource_type: 'api_key',
          resource_id: String(saved.id),
          metadata: { name: saved.name, api: saved.api },
        });
      } catch (err: unknown) {
        // non-fatal for key creation; log it server-side
        this.logger.warn(
          'Failed to write audit for api key create: ' +
            (err instanceof Error ? err.message : String(err)),
        );
      }
      return { key: publicKey, ...safe };
    } catch (err: unknown) {
      // If something like duplicate hash occur (unlikely), log and throw
      this.logger.warn(
        'Unable to create key: ' +
          (err instanceof Error ? err.message : String(err)),
      );
      throw new BadRequestException('Unable to create key');
    }
  }

  async updateForUser(
    userId: string,
    id: number,
    dto: UpdateConsumerApiKeyDto,
  ) {
    const found = await this.repo.findOne({
      where: { id: String(id), user_id: userId },
    });
    if (!found) throw new NotFoundException('Api key not found');

    // Only update allowed fields
    if (dto.name !== undefined) found.name = dto.name;
    if (dto.rate_limit_per_minute !== undefined)
      found.rate_limit_per_minute = dto.rate_limit_per_minute;
    if (dto.quota_daily !== undefined) found.quota_daily = dto.quota_daily;
    if (dto.quota_monthly !== undefined)
      found.quota_monthly = dto.quota_monthly;
    if (dto.expires_at !== undefined)
      found.expires_at = dto.expires_at ? new Date(dto.expires_at) : null;

    return this.repo.save(found);
  }

  // Soft revoke - set revoked_at timestamp
  async revokeForUser(userId: string, id: number) {
    const found = await this.repo.findOne({
      where: { id: String(id), user_id: userId },
    });
    if (!found) throw new NotFoundException('Api key not found');
    found.revoked_at = new Date();
    const saved = await this.repo.save(found);

    try {
      await this.activityLogService?.createAudit({
        actor_id: String(userId),
        event: EventType.API_KEY_DELETED,
        resource_type: 'api_key',
        resource_id: String(saved.id),
        metadata: { name: saved.name },
      });
    } catch (err) {
      // ignore logging failures for non-blocking behaviour but log locally
      this.logger.warn(
        'Failed to write audit for api key revoke: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }

    return saved;
  }
}
