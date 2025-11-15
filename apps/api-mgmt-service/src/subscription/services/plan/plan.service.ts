import { paginate, PaginatedResponse } from '@huzaflix/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSubscriptionPlanDto } from 'src/subscription/dto/plan/plan-create.dto';
import { UpdateSubscriptionPlanDto } from 'src/subscription/dto/plan/plan-update.dto';
import {
  PlanStatus,
  SubscriptionPlan,
} from 'src/subscription/entities/plans.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
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
  ): Promise<
    { data: SubscriptionPlan[]; meta: PaginatedResponse } | SubscriptionPlan[]
  > {
    const isAdmin = role === 'administrator';
    const isPaginated = page && limit;

    if (!isPaginated) {
      return isAdmin
        ? this.planRepository.find()
        : this.planRepository.find({ where: { status: PlanStatus.ACTIVE } });
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const where = isAdmin ? {} : { status: PlanStatus.ACTIVE };

    const [apis, total] = await this.planRepository.findAndCount({
      where,
      skip,
      take,
    });

    return paginate(apis, page, limit, total);
  }

  async findOneById(
    id: number,
    role?: string,
  ): Promise<SubscriptionPlan | null> {
    const isAdmin = role === 'administrator';
    const where = isAdmin ? { id } : { id: id, status: PlanStatus.ACTIVE };
    return this.planRepository.findOne({ where });
  }

  async create(plan: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.planRepository.save(plan);
  }

  async update(
    id: number,
    plan: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    const existingPlan = await this.planRepository.findOne({ where: { id } });
    if (!existingPlan) throw new Error(`Plan with id ${id} not found`);
    if (existingPlan.status === PlanStatus.ACTIVE) {
      throw new ForbiddenException(`Plan with id ${id} is active`);
    }

    Object.assign(existingPlan, plan);
    return this.planRepository.save(existingPlan);
  }

  async activate(id: number): Promise<SubscriptionPlan> {
    const existingPlan = await this.planRepository.findOne({ where: { id } });
    if (!existingPlan) throw new Error(`Plan with id ${id} not found`);
    if (existingPlan.status === PlanStatus.ACTIVE) {
      throw new ForbiddenException(`Plan with id ${id} is already active`);
    }

    existingPlan.status = PlanStatus.ACTIVE;
    return this.planRepository.save(existingPlan);
  }

  async deactivate(id: number): Promise<SubscriptionPlan> {
    const existingPlan = await this.planRepository.findOne({ where: { id } });
    if (!existingPlan) throw new Error(`Plan with id ${id} not found`);
    if (existingPlan.status === PlanStatus.INACTIVE) {
      throw new ForbiddenException(`Plan with id ${id} is already inactive`);
    }

    existingPlan.status = PlanStatus.INACTIVE;
    return this.planRepository.save(existingPlan);
  }

  async delete(id: number): Promise<void> {
    const existingPlan = await this.planRepository.findOne({ where: { id } });
    if (!existingPlan) throw new Error(`Plan with id ${id} not found`);
    if (existingPlan.status === PlanStatus.ACTIVE) {
      throw new ForbiddenException(`Plan with id ${id} is active`);
    }

    await this.planRepository.remove(existingPlan);
  }
}
