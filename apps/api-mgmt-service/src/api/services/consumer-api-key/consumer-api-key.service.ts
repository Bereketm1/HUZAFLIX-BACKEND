import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityLogService } from '../../activity-log/activity-log.service';
import { EventType } from '../../entities/audit-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import { CreateConsumerApiKeyDto } from '../../dto/consumer-api-key/create-consumer-api-key.dto';
import { UpdateConsumerApiKeyDto } from '../../dto/consumer-api-key/update-consumer-api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ConsumerApiKeyService {
  constructor(
    @InjectRepository(ApiKey) private repo: Repository<ApiKey>,
    private readonly activityLogService?: ActivityLogService,
  ) {}

  // Returns user-owned keys (without exposing the secret hash)
  async findAllForUser(userId: string) {
    const keys = await this.repo.find({ where: { user_id: userId } });
    // hide sensitive key_hash before returning
    return keys.map((k) => {
      const { key_hash, ...safe } = k as any;
      return safe;
    });
  }

  // Creates a new API key, stores hash and returns the one-time cleartext key
  async createForUser(userId: string, dto: CreateConsumerApiKeyDto) {
    // generate a key with prefix and secret value
    const prefix = crypto.randomBytes(6).toString('hex').slice(0, 8).toUpperCase();
    const secret = crypto.randomBytes(24).toString('base64url');
    const publicKey = `${prefix}_${secret}`;

    const hash = crypto.createHash('sha256').update(publicKey).digest();

    const entity = this.repo.create({
      user_id: userId,
      key_hash: hash,
      key_prefix: prefix,
      name: dto.name,
      rate_limit_per_minute: dto.rate_limit_per_minute ?? 60,
      quota_daily: dto.quota_daily,
      quota_monthly: dto.quota_monthly,
      expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
      api: dto.api_id ? ({ id: String(dto.api_id) } as any) : undefined,
    } as any);

    try {
      const saved = await this.repo.save(entity);
      // Return created DB record (without hash) plus the cleartext key
      const { key_hash, ...safe } = saved as any;
      // create an audit entry (best effort)
      try {
        await this.activityLogService?.createAudit({
          actor_id: String(userId),
          event: EventType.API_KEY_CREATED,
          resource_type: 'api_key',
          resource_id: String((saved as any).id),
          metadata: { name: saved.name, api: saved.api },
        } as any);
      } catch (err) {
        // non-fatal for key creation; log it server-side if needed
      }
      return { key: publicKey, ...safe };
    } catch (err) {
      // If something like duplicate hash occur (unlikely), throw
      throw new BadRequestException('Unable to create key');
    }
  }

  async updateForUser(userId: string, id: number, dto: UpdateConsumerApiKeyDto) {
    const found = await this.repo.findOne({ where: { id: String(id), user_id: userId } });
    if (!found) throw new NotFoundException('Api key not found');

    // Only update allowed fields
    if (dto.name !== undefined) found.name = dto.name;
    if (dto.rate_limit_per_minute !== undefined) found.rate_limit_per_minute = dto.rate_limit_per_minute;
    if (dto.quota_daily !== undefined) found.quota_daily = dto.quota_daily;
    if (dto.quota_monthly !== undefined) found.quota_monthly = dto.quota_monthly;
    if (dto.expires_at !== undefined) found.expires_at = dto.expires_at ? new Date(dto.expires_at) : null;

    return this.repo.save(found);
  }

  // Soft revoke - set revoked_at timestamp
  async revokeForUser(userId: string, id: number) {
    const found = await this.repo.findOne({ where: { id: String(id), user_id: userId } });
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
      } as any);
    } catch (err) {
      // ignore logging failures for non-blocking behaviour
    }

    return saved;
  }
}
