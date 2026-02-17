import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey, KeyStatus } from '../../entities/api-key.entity';
import type { DeepPartial } from 'typeorm';
import { Api } from '../../entities/api.entity';
import { CreateConsumerApiKeyDto } from '../../dto/consumer-api-key/create-consumer-api-key.dto';
import { UpdateConsumerApiKeyDto } from '../../dto/consumer-api-key/update-consumer-api-key.dto';
import * as crypto from 'crypto';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/subscription/entities/subscriptions.entity';

@Injectable()
export class ConsumerApiKeyService {
  private readonly logger = new Logger(ConsumerApiKeyService.name);
  constructor(
    @InjectRepository(ApiKey) private readonly repo: Repository<ApiKey>,
    @InjectRepository(Api) private readonly apiRepository: Repository<Api>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  private resolveExpiry(
    expiresAt?: string,
    expiresInDays?: number,
  ): Date | null {
    if (expiresAt) {
      const parsed = new Date(expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Invalid expires_at date format');
      }
      return parsed;
    }

    if (expiresInDays) {
      const now = new Date();
      now.setDate(now.getDate() + expiresInDays);
      return now;
    }

    return null;
  }

  private async getOwnedKeyOrThrow(
    userId: string,
    id: number,
  ): Promise<ApiKey> {
    const found = await this.repo.findOne({
      where: { id: String(id), user_id: userId },
    });
    if (!found) {
      throw new NotFoundException('Consumer API key not found');
    }

    return found;
  }

  private sanitizeKey(apiKey: ApiKey): Omit<ApiKey, 'key_hash'> {
    const { key_hash: _keyHash, ...safe } = apiKey;
    void _keyHash;
    return safe as Omit<ApiKey, 'key_hash'>;
  }

  async createForUser(userId: string, dto: CreateConsumerApiKeyDto) {
    const api = await this.apiRepository.findOneBy({ id: dto.api_id });
    if (!api) {
      throw new NotFoundException(`API with id ${dto.api_id} not found`);
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user_id: Number(userId),
        api_id: dto.api_id,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription) {
      throw new ForbiddenException(
        `You must have an active subscription to API ${dto.api_id} before creating a consumer API key`,
      );
    }

    const prefix = crypto
      .randomBytes(6)
      .toString('hex')
      .slice(0, 8)
      .toUpperCase();
    const secret = crypto.randomBytes(24).toString('base64url');
    const publicKey = `${prefix}_${secret}`;
    const hash = crypto.createHash('sha256').update(publicKey).digest();
    const keyName = dto.name || `key-${crypto.randomBytes(4).toString('hex')}`;

    const partial: DeepPartial<ApiKey> = {
      user_id: userId,
      key_hash: hash,
      key_prefix: prefix,
      name: keyName,
      expires_at: this.resolveExpiry(dto.expires_at, dto.expires_in_days),
      status: KeyStatus.ACTIVE,
      api: { id: dto.api_id } as Partial<Api>,
    };

    const entity = this.repo.create(partial);

    try {
      const saved = await this.repo.save(entity);
      return { key: publicKey, ...this.sanitizeKey(saved) };
    } catch (err: unknown) {
      this.logger.warn(
        'Unable to create consumer API key: ' +
          (err instanceof Error ? err.message : String(err)),
      );
      throw new BadRequestException('Unable to create consumer API key');
    }
  }

  async activateForUser(userId: string, id: number) {
    const found = await this.getOwnedKeyOrThrow(userId, id);
    if (found.revoked_at) {
      throw new BadRequestException(
        'Revoked consumer API keys cannot be reactivated',
      );
    }

    found.status = KeyStatus.ACTIVE;
    const saved = await this.repo.save(found);
    return this.sanitizeKey(saved);
  }

  async deactivateForUser(userId: string, id: number) {
    const found = await this.getOwnedKeyOrThrow(userId, id);
    if (found.revoked_at) {
      throw new BadRequestException(
        'Revoked consumer API keys cannot be deactivated',
      );
    }

    found.status = KeyStatus.INACTIVE;
    const saved = await this.repo.save(found);
    return this.sanitizeKey(saved);
  }

  async updateExpiryForUser(
    userId: string,
    id: number,
    dto: UpdateConsumerApiKeyDto,
  ) {
    const found = await this.getOwnedKeyOrThrow(userId, id);
    if (found.revoked_at) {
      throw new BadRequestException(
        'Revoked consumer API keys cannot be updated',
      );
    }

    found.expires_at = this.resolveExpiry(dto.expires_at, dto.expires_in_days);
    const saved = await this.repo.save(found);
    return this.sanitizeKey(saved);
  }

  async revokeForUser(userId: string, id: number) {
    const found = await this.getOwnedKeyOrThrow(userId, id);
    if (found.revoked_at) {
      throw new BadRequestException('Consumer API key is already revoked');
    }

    found.status = KeyStatus.INACTIVE;
    found.revoked_at = new Date();
    const saved = await this.repo.save(found);
    return this.sanitizeKey(saved);
  }
}
