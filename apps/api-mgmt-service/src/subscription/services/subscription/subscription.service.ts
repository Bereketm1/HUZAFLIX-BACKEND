import { paginate, PaginatedResponse } from '@huzaflix/common';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSubscriptionDto } from 'src/subscription/dto/subscription/subscription-create.dto';
import {
  PlanType,
  SubscriptionPlan,
} from 'src/subscription/entities/plans.entity';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/subscription/entities/subscriptions.entity';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { ActivityLogService } from 'src/api/activity-log/activity-log.service';
import { EventType } from 'src/api/entities/audit-log.entity';
import { Api } from 'src/api/entities/api.entity';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,

    @InjectRepository(Api)
    private readonly apiRepository: Repository<Api>,
    private readonly activityLogService?: ActivityLogService,
  ) {}

  private computeNextMonth(date: Date): Date {
    const end = new Date(date);
    end.setMonth(end.getMonth() + 1);
    return end;
  }

  private computeNextYear(date: Date): Date {
    const end = new Date(date);
    end.setFullYear(end.getFullYear() + 1);
    return end;
  }

  async create(
    data: CreateSubscriptionDto,
    user_id: number,
  ): Promise<Subscription> {
    const plan = await this.planRepository.findOne({
      where: { id: data.plan_id },
    });

    const api = await this.apiRepository.findOne({
      where: { id: data.api_id },
    });

    if (!plan) throw new NotFoundException(`Plan ${data.plan_id} not found`);
    if (!api) throw new NotFoundException(`API ${data.api_id} not found`);

    const existingSubForPlan = await this.subscriptionRepository.findOne({
      where: {
        user_id,
        plan_id: plan.id,
        api_id: api.id,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubForPlan)
      throw new BadRequestException(
        `User already has a subscription for plan ${plan.name}`,
      );

    const now = new Date();

    const subscription = this.subscriptionRepository.create({
      user_id: user_id,
      plan_id: plan.id,
      api_id: api.id,
      start_date: now,
      end_date:
        plan.plan_type === PlanType.MONTHLY
          ? this.computeNextMonth(now)
          : this.computeNextYear(now),
      auto_renew: true,

      current_cycle_start: now,
      current_cycle_end: this.computeNextMonth(now),

      status: SubscriptionStatus.ACTIVE,
      calls_used_this_cycle: 0,
    });

    const saved = await this.subscriptionRepository.save(subscription);

    return saved;
  }

  async findAll(
    {
      page,
      limit,
    }: {
      page?: number;
      limit?: number;
    },
    user_id: number,
    role?: string,
  ): Promise<
    { data: Subscription[]; meta: PaginatedResponse } | Subscription[]
  > {
    const isAdmin = role === 'administrator';
    const isPaginated = page && limit;

    if (!isPaginated) {
      return isAdmin
        ? this.subscriptionRepository.find({ relations: ['plan'] })
        : this.subscriptionRepository.find({
            where: { user_id },
            relations: ['plan'],
          });
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const where = isAdmin ? {} : { user_id, status: SubscriptionStatus.ACTIVE };

    const [subscriptions, total] =
      await this.subscriptionRepository.findAndCount({
        where,
        relations: ['plan'],
        skip,
        take,
      });

    return paginate(subscriptions, page, limit, total);
  }

  async findOne(
    id: number,
    user_id: number,
    role?: string,
  ): Promise<Subscription> {
    const isAdmin = role === 'administrator';
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, ...(!isAdmin ? { user_id } : {}) },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }

    return subscription;
  }

  async incrementUsage(id: number, user_id: number): Promise<Subscription> {
    const subscription = await this.findOne(id, user_id);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is not active');
    }

    const plan = await this.planRepository.findOne({
      where: { id: subscription.plan_id },
    });

    if (!plan) throw new NotFoundException('Plan not found');

    if (subscription.calls_used_this_cycle >= plan.monthly_call_limit) {
      throw new BadRequestException('Monthly call limit reached');
    }

    subscription.calls_used_this_cycle += 1;

    return await this.subscriptionRepository.save(subscription);
  }

  async renew(id: number, user_id: number): Promise<Subscription> {
    const subscription = await this.findOne(id, user_id);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.auto_renew) {
      subscription.status = SubscriptionStatus.EXPIRED;
      return await this.subscriptionRepository.save(subscription);
    }

    const now = new Date();

    subscription.current_cycle_start = now;
    subscription.current_cycle_end = this.computeNextMonth(now);
    subscription.end_date = subscription.current_cycle_end;
    subscription.calls_used_this_cycle = 0;

    subscription.status = SubscriptionStatus.ACTIVE;

    return await this.subscriptionRepository.save(subscription);
  }

  async cancel(id: number, user_id: number): Promise<Subscription> {
    const subscription = await this.findOne(id, user_id);

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.auto_renew = false;
    subscription.status = SubscriptionStatus.CANCELLED;
    const saved = await this.subscriptionRepository.save(subscription);

    return saved;
  }

  async findByUserId(userId: number): Promise<Subscription | null> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        user_id: userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    if (!subscription) {
      return null;
    }
    return subscription;
  }
}
