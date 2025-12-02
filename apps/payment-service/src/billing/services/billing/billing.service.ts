import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '@huzaflix/common';
import { paginate } from '@huzaflix/common';
import { Billing } from 'src/billing/entities/billing.entity';
import { CreateBillingInfoDto } from 'src/billing/dtos/billing/create-billing.dto';
import { UpdateBillingInfoDto } from 'src/billing/dtos/billing/update-billing.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing)
    private readonly billingRepository: Repository<Billing>,
  ) {}

  async create(dto: CreateBillingInfoDto, userId: number): Promise<Billing> {
    const billing = this.billingRepository.create({ ...dto, userId });
    return await this.billingRepository.save(billing);
  }

  async findAll({
    userId,
    page,
    limit,
  }: {
    userId: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: Billing[]; meta: PaginatedResponse } | Billing[]> {
    if (!page || !limit) {
      return this.billingRepository.find();
    }
    const [billingProfiles, total] = await this.billingRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(billingProfiles, page, limit, total);
  }

  async findOneById(id: number, userId: number): Promise<Billing> {
    const billing = await this.billingRepository.findOne({
      where: { id, userId },
    });
    if (!billing)
      throw new NotFoundException(`Billing info with ID ${id} not found`);
    return billing;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateBillingInfoDto,
  ): Promise<Billing> {
    const billing = await this.findOneById(id, userId);
    Object.assign(billing, { ...dto, updatedAt: new Date() });
    return await this.billingRepository.save(billing);
  }

  async remove(id: number, userId: number): Promise<void> {
    const billing = await this.findOneById(id, userId);

    if (billing.credits > 0) {
      throw new UnprocessableEntityException(
        `Cannot delete billing info: credits must be 0 (current credits: ${billing.credits})`,
      );
    }

    await this.billingRepository.remove(billing);
  }

  async forceRemove(id: number, userId: number): Promise<void> {
    const billing = await this.findOneById(id, userId);
    await this.billingRepository.remove(billing);
  }
}
