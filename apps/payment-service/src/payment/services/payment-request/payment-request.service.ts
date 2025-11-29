import { paginate, PaginatedResponse } from '@huzaflix/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePaymentRequestDto } from 'src/payment/dto/payment-request/create-payment-request.dto';
import { PaymentRequest } from 'src/payment/entities/payment-request.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentRequestService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRepository: Repository<PaymentRequest>,
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
    userId?: number,
  ): Promise<
    { data: PaymentRequest[]; meta: PaginatedResponse } | PaymentRequest[]
  > {
    const isAdmin = role === 'administrator';
    const isPaginated = page && limit;

    if (!isPaginated) {
      return isAdmin
        ? this.paymentRepository.find()
        : this.paymentRepository.find({ where: { userId: userId } });
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const where = isAdmin ? {} : { userId: userId };

    const [prs, total] = await this.paymentRepository.findAndCount({
      where,
      skip,
      take,
    });

    return paginate(prs, page, limit, total);
  }

  async findOneById(id: number, role?: string): Promise<PaymentRequest> {
    const isAdmin = role === 'administrator';
    const where = isAdmin ? { id: id } : { id: id };

    const pr = await this.paymentRepository.findOne({
      where: where,
    });
    if (!pr) {
      throw new NotFoundException(`Payment Request with id ${id} not found`);
    }
    return pr;
  }

  async create(
    data: CreatePaymentRequestDto & { userId: number },
  ): Promise<PaymentRequest> {
    const pr = this.paymentRepository.create(data);
    await this.paymentRepository.save(pr);
    return pr;
  }
}
