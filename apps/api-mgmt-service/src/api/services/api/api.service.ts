import {
  decrypt,
  encrypt,
  MinioService,
  paginate,
  PaginatedResponse,
} from '@huzaflix/common';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateApiDto } from 'src/api/dto/api/api-create.dto';
import { UpdateApiDto } from 'src/api/dto/api/api-update.dto';
import { Api, ApiStatus } from 'src/api/entities/api.entity';
import { SubscriptionPlan } from 'src/subscription/entities/plans.entity';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/subscription/entities/subscriptions.entity';
import { PlanService } from 'src/subscription/services/plan/plan.service';
import { Repository } from 'typeorm';
import { AuditLogClient, type UptimeStats } from '../metrics/audit-log.client';

export type ApiUsageMetrics = {
  userId: number;
  subscriptionId: number | null;
  callsUsed: number;
  callLimit: number;
  usagePct: number | null;
};

export type ApiUptimeMetrics = {
  percentage: number;
  success: number;
  total: number;
  startDate?: string;
  endDate?: string;
};

export type ApiMetrics = {
  uptime: ApiUptimeMetrics;
  usage: ApiUsageMetrics;
};

export type ApiWithMetrics = Api & {
  metrics: ApiMetrics;
};

@Injectable()
export class ApiService {
  constructor(
    @InjectRepository(Api)
    private readonly apiRepository: Repository<Api>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly minioService: MinioService,
    private readonly planService: PlanService,
    private readonly auditLogClient: AuditLogClient,
  ) {}

  async findAll(
    {
      page,
      limit,
    }: {
      page?: number;
      limit?: number;
    },
    role?: string,
  ): Promise<{ data: Api[]; meta: PaginatedResponse } | Api[]> {
    const isAdmin = role === 'administrator';
    const isPaginated = page && limit;

    if (!isPaginated) {
      return isAdmin
        ? this.apiRepository.find()
        : this.apiRepository.find({ where: { status: ApiStatus.ACTIVE } });
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const where = isAdmin ? {} : { status: ApiStatus.ACTIVE };

    const [apis, total] = await this.apiRepository.findAndCount({
      where,
      skip,
      take,
    });

    return paginate(apis, page, limit, total);
  }

  async findAllWithMetrics(
    {
      page,
      limit,
    }: {
      page?: number;
      limit?: number;
    },
    role: string | undefined,
    userId: number,
    window?: { startDate?: Date; endDate?: Date },
  ): Promise<
    { data: ApiWithMetrics[]; meta: PaginatedResponse } | ApiWithMetrics[]
  > {
    const result = await this.findAll({ page, limit }, role);
    if (Array.isArray(result)) {
      return await this.attachMetrics(result, userId, window);
    }

    return {
      ...result,
      data: await this.attachMetrics(result.data, userId, window),
    };
  }

  async findRecentUsed(userId: number, limit = 10): Promise<Api[]> {
    const subscriptions = await this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.api', 'api')
      .where('subscription.user_id = :userId', { userId })
      .andWhere('subscription.status = :status', {
        status: SubscriptionStatus.ACTIVE,
      })
      .orderBy('subscription.updated_at', 'DESC')
      .take(limit)
      .getMany();

    const seen = new Set<number>();
    return subscriptions
      .map((subscription) => subscription.api)
      .filter((api): api is Api => {
        if (!api || seen.has(api.id)) {
          return false;
        }
        seen.add(api.id);
        return true;
      });
  }

  async findOneById(
    id: number,
    role?: string,
    userId?: number,
  ): Promise<Api & { isSubscribed: boolean }> {
    const isAdmin = role === 'administrator';
    const where = isAdmin ? { id: id } : { id: id, status: ApiStatus.ACTIVE };

    const api = await this.apiRepository.findOne({
      where: where,
    });
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    if (userId) {
      return { ...api, isSubscribed: await this.isSubscribed(id, userId) };
    } else {
      return { ...api, isSubscribed: false };
    }
  }

  async create(data: CreateApiDto & { created_by: string }): Promise<Api> {
    const api = this.apiRepository.create(data);
    api.base_api_key = encrypt(data.base_api_key);
    if (data.test_api_key) {
      api.test_api_key = encrypt(data.test_api_key);
    }
    return this.apiRepository.save(api);
  }

  async update(id: number, data: UpdateApiDto): Promise<Api> {
    const api = await this.apiRepository.findOneBy({ id });
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }

    if (api.status == ApiStatus.ACTIVE) {
      throw new ForbiddenException('Cannot update an active API');
    }

    if (data.base_api_key) {
      if (decrypt(api.base_api_key) !== data.base_api_key) {
        data.base_api_key = encrypt(data.base_api_key);
      }
    }

    if (data.test_api_key) {
      const existingTestApiKey = api.test_api_key
        ? decrypt(api.test_api_key)
        : null;
      if (existingTestApiKey !== data.test_api_key) {
        data.test_api_key = encrypt(data.test_api_key);
      }
    }

    Object.assign(api, data);
    return this.apiRepository.save(api);
  }

  async activate(id: number): Promise<Api> {
    const api = await this.apiRepository.findOneBy({ id });
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    if (api.status == ApiStatus.ACTIVE) {
      throw new ForbiddenException('You Cannot activate an active api');
    }
    api.status = ApiStatus.ACTIVE;
    api.activated_at = new Date();
    return this.apiRepository.save(api);
  }

  async deactivate(id: number): Promise<Api> {
    const api = await this.apiRepository.findOneBy({ id });
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    api.status = ApiStatus.INACTIVE;
    api.activated_at = null;
    return this.apiRepository.save(api);
  }

  async getUniqueApiCategories(): Promise<string[]> {
    const categories = await this.apiRepository
      .createQueryBuilder('api')
      .select('DISTINCT api.category', 'category')
      .getRawMany();

    return categories.map((row: { category: string }) => row.category);
  }

  async delete(id: number): Promise<void> {
    const api = await this.apiRepository.findOneBy({ id });
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    if (api.status === ApiStatus.ACTIVE) {
      throw new ForbiddenException(
        `API with id ${id} is active, you cannot delete an active api please deactivate it first`,
      );
    }
    await this.apiRepository.remove(api);
  }

  async filterByCategory(
    category: string,
    role?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Api[]; meta: PaginatedResponse } | Api[]> {
    const isAdmin = role === 'administrator';
    const isPaginated = page && limit;

    if (!isPaginated) {
      return isAdmin
        ? this.apiRepository.find({ where: { category } })
        : this.apiRepository.find({
            where: { category: category, status: ApiStatus.ACTIVE },
          });
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const where = isAdmin
      ? { category }
      : { category: category, status: ApiStatus.ACTIVE };

    const [apis, total] = await this.apiRepository.findAndCount({
      where,
      skip,
      take,
    });

    return paginate(apis, page, limit, total);
  }

  async filterByCategoryWithMetrics(
    category: string,
    role: string | undefined,
    userId: number,
    page?: number,
    limit?: number,
    window?: { startDate?: Date; endDate?: Date },
  ): Promise<
    { data: ApiWithMetrics[]; meta: PaginatedResponse } | ApiWithMetrics[]
  > {
    const result = await this.filterByCategory(category, role, page, limit);
    if (Array.isArray(result)) {
      return await this.attachMetrics(result, userId, window);
    }

    return {
      ...result,
      data: await this.attachMetrics(result.data, userId, window),
    };
  }

  async getMetrics(
    apiId: number,
    userId: number,
    window?: { startDate?: Date; endDate?: Date },
  ): Promise<ApiMetrics> {
    const api = await this.apiRepository.findOneBy({ id: apiId });
    if (!api) {
      throw new NotFoundException(`API with id ${apiId} not found`);
    }

    const uptimeBasePath = `/api-management/playground/${api.id}`;
    const uptimeStats = await this.auditLogClient.getUptimeStats(
      uptimeBasePath,
      window?.startDate,
      window?.endDate,
    );

    const usage = await this.getUsageMetrics(apiId, userId);
    return {
      uptime: this.toUptimeMetrics(uptimeStats),
      usage,
    };
  }

  private toUptimeMetrics(stats: UptimeStats): ApiUptimeMetrics {
    return {
      percentage: Number(stats.uptimePct.toFixed(2)),
      success: stats.success,
      total: stats.total,
      startDate: stats.startDate,
      endDate: stats.endDate,
    };
  }

  private async getUsageMetrics(
    apiId: number,
    userId: number,
  ): Promise<ApiUsageMetrics> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        api_id: apiId,
        user_id: userId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
    });

    if (!subscription || !subscription.plan) {
      return {
        userId,
        subscriptionId: null,
        callsUsed: 0,
        callLimit: 0,
        usagePct: null,
      };
    }

    const callLimit = subscription.plan.monthly_call_limit;
    const callsUsed = subscription.calls_used_this_cycle;
    const usagePct =
      callLimit > 0 ? Number(((callsUsed / callLimit) * 100).toFixed(2)) : 0;

    return {
      userId,
      subscriptionId: subscription.id,
      callsUsed,
      callLimit,
      usagePct: Math.min(100, Math.max(0, usagePct)),
    };
  }

  private async attachMetrics(
    apis: Api[],
    userId: number,
    window?: { startDate?: Date; endDate?: Date },
  ): Promise<ApiWithMetrics[]> {
    const enriched = await Promise.all(
      apis.map(async (api) => ({
        ...api,
        metrics: await this.getMetrics(api.id, userId, window),
      })),
    );

    return enriched;
  }

  async uploadDocs(id: number, file: Express.Multer.File): Promise<Api> {
    const api = await this.apiRepository.findOneBy({ id });
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    const uploadFile = await this.minioService.uploadFile(file);
    api.openapi_spec_url =
      process.env.NODE_ENV === 'production'
        ? `http://${process.env.SERVER_HOST}/api-management/apis/docs/${uploadFile.filename}`
        : `http://${process.env.SERVER_HOST}/api/api-management/apis/docs/${uploadFile.filename}`;
    return this.apiRepository.save(api);
  }

  async getDocs(filename: string): Promise<string> {
    const fileUrl = await this.minioService.getFile(filename);
    return fileUrl?.url;
  }

  async pricing(
    id: number,
    role?: string,
  ): Promise<
    { name: string; avg_price_per_call: number; call_limit: number }[]
  > {
    const api = await this.apiRepository.findOneBy({ id });
    if (!api) {
      throw new NotFoundException(`API with id ${id} not found`);
    }
    const price = (await this.planService.findAll(
      {
        page: undefined,
        limit: undefined,
      },
      role,
    )) as SubscriptionPlan[];

    const priceList = price.map((plan: SubscriptionPlan) => ({
      name: plan.name,
      avg_price_per_call: plan.avg_price_per_call,
      call_limit: plan.monthly_call_limit,
    }));

    return priceList;
  }

  async isSubscribed(apiId: number, userId: number) {
    const subscription = await this.subscriptionRepository.findOneBy({
      api_id: apiId,
      user_id: userId,
      status: SubscriptionStatus.ACTIVE,
    });

    if (subscription) {
      return true;
    } else {
      return false;
    }
  }
}
