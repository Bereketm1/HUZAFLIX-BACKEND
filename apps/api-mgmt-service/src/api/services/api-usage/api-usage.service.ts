import * as crypto from 'crypto';
import { Api, ApiStatus } from '../../entities/api.entity';
import { ApiKey } from '../../entities/api-key.entity';
import { Subscription, SubscriptionStatus } from '../../../subscription/entities/subscriptions.entity';
import { SubscriptionPlan } from '../../../subscription/entities/plans.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  userId?: number;
}

@Injectable()
export class ApiUsageService {
  private readonly logger = new Logger(ApiUsageService.name);

  constructor(
    @InjectRepository(Api)
    private readonly apiRepository: Repository<Api>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  async validateRequest(
    apiKey: string,
    path: string,
  ): Promise<ValidationResult> {
    // 1. Identify valid managed API based on path
    // We fetch all active APIs to find a match. 
    // Optimization: Cache this list or use a better query if volume matches.
    // Normalize path. Internal path usually starts with /
    const internalPath = path.startsWith('/') ? path : '/' + path;

    const apis = await this.apiRepository.find({ where: { status: ApiStatus.ACTIVE } });
    
    // Find the longest matching base_path to be specific
    const matchedApi = apis
        .filter(api => internalPath.startsWith(api.base_path))
        .sort((a, b) => b.base_path.length - a.base_path.length)[0];

    if (!matchedApi) {
        // Not a managed API, so we allow it to pass through to underlying services
        return { allowed: true }; 
    }

    if (!apiKey) {
      return { allowed: false, reason: 'Missing API Key' };
    }

    // 2. Validate API Key
    // Key format: prefix_secret. We hash it to match storage.
    const hash = crypto.createHash('sha256').update(apiKey).digest();
    
    const keyEntity = await this.apiKeyRepository.findOne({
        where: { key_hash: hash as any }, // TypeORM bytea handling might require buffer or specific type
        relations: ['api'],
    });

    if (!keyEntity) {
        return { allowed: false, reason: 'Invalid API Key' };
    }

    if (keyEntity.status !== 'active') { // KeyStatus.ACTIVE
        return { allowed: false, reason: 'API Key is inactive' };
    }
    
    if (keyEntity.expires_at && new Date() > keyEntity.expires_at) {
        return { allowed: false, reason: 'API Key expired' };
    }

    if (keyEntity.revoked_at) {
        return { allowed: false, reason: 'API Key revoked' };
    }

    // Check if Key is scoped to specific API (if applicable)
    // The entity has `api` relation. If set, it must match.
    if (keyEntity.api && keyEntity.api.id !== matchedApi.id) {
         return { allowed: false, reason: 'API Key not authorized for this API' };
    }

    // 3. Rate Limit & Quota Checks (API Key Level)
    // TODO: Implement Redis-based rate limiting here for strict enforcement.
    // For now, we focus on Subscription Plan limits (Billing).

    // 4. Check Subscription
    const subscription = await this.subscriptionRepository.findOne({
        where: {
            user_id: Number(keyEntity.user_id),
            api_id: matchedApi.id,
            status: SubscriptionStatus.ACTIVE
        },
        relations: ['plan']
    });

    if (!subscription) {
        return { allowed: false, reason: 'No active subscription for this API' };
    }

    // Check Plan Limits
    const plan = subscription.plan;
    if (!plan) {
         return { allowed: false, reason: 'Subscription plan not found' };
    }

    // Reset cycle if needed (Simplified logic: if current date > current_cycle_end)
    const now = new Date();
    if (now > subscription.current_cycle_end) {
        // Auto-renew or expire logic should handle this via cron/scheduler ideally.
        // For strict enforcement, if it's past due and not renewed, we block.
        // But if auto-renew is on, maybe we auto-renew here? Check `auto_renew`.
        // To keep it simple and safe: Block if expired/past cycle until renewed.
        return { allowed: false, reason: 'Subscription cycle expired. Please renew.' };
    }

    if (subscription.calls_used_this_cycle >= plan.monthly_call_limit) { 
        // Logic assumes monthly limit is the main one for now.
        return { allowed: false, reason: 'Monthly call limit reached' };
    }

    // 5. Increment Usage
    // We increment async to avoid blocking response too much? 
    // For strict enforcement, we await.
    subscription.calls_used_this_cycle += 1;
    await this.subscriptionRepository.save(subscription);

    return { allowed: true, userId: Number(keyEntity.user_id) };
  }
}
