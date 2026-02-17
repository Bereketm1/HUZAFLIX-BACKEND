import { paginate, PaginatedResponse } from '@huzaflix/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from 'src/payment/dto/transaction/create-transaction.dto';
import { Transaction } from 'src/payment/entities/transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async findAll(
    {
      page,
      limit,
      startDate,
      endDate,
      sortBy,
      order,
    }: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      order?: 'asc' | 'desc';
    },
    role?: string,
    userId?: number,
  ): Promise<{ data: Transaction[]; meta: PaginatedResponse } | Transaction[]> {
    const isAdmin =
      typeof role === 'string' && role.toLowerCase().includes('admin');
    const isPaginated = typeof page === 'number' && typeof limit === 'number';

    // non-paginated behaviour unchanged
    if (!isPaginated && !startDate && !endDate && !sortBy) {
      return isAdmin
        ? this.transactionRepository.find()
        : this.transactionRepository.find({ where: { userId: userId } });
    }

    const skip = isPaginated ? (page - 1) * (limit as number) : undefined;
    const take = isPaginated ? (limit as number) : undefined;

    // If there are filters or sorting, use query builder to support dates and ordering
    const useQueryBuilder = !!(startDate || endDate || sortBy);

    if (useQueryBuilder) {
      const qb = this.transactionRepository.createQueryBuilder('t');

      if (!isAdmin) {
        qb.andWhere('t.userId = :userId', { userId });
      }

      if (startDate) {
        qb.andWhere('t.created_at >= :startDate', { startDate });
      }

      if (endDate) {
        qb.andWhere('t.created_at <= :endDate', { endDate });
      }

      const allowedSorts = ['created_at', 'amount', 'id'];
      const sortColumn = typeof sortBy === 'string' && allowedSorts.includes(sortBy)
        ? `t.${sortBy}`
        : 't.created_at';
      const sortOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      qb.orderBy(sortColumn, sortOrder);

      if (typeof skip === 'number' && typeof take === 'number') {
        qb.skip(skip).take(take);
      }

      const [prs, total] = await qb.getManyAndCount();
      // If paginated return paginated format, otherwise return array
      if (typeof page === 'number' && typeof limit === 'number') {
        return paginate(prs, page, limit, total);
      }
      return prs;
    }

    // fallback to previous repository.findAndCount when no filters
    const where = isAdmin ? {} : { userId: userId };

    const [prs, total] = await this.transactionRepository.findAndCount({
      where,
      skip,
      take,
    });

    // Type-check: only call paginate when page & limit are numbers
    if (typeof page === 'number' && typeof limit === 'number') {
      return paginate(prs, page, limit, total);
    }

    // Fallback (shouldn't normally happen because of earlier guard)
    return prs;
  }

  async findOneById(id: number, role?: string): Promise<Transaction> {
    const isAdmin =
      typeof role === 'string' && role.toLowerCase().includes('admin');
    const where = isAdmin ? { id: id } : { id: id };

    const pr = await this.transactionRepository.findOne({
      where: where,
    });
    if (!pr) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return pr;
  }

  async findOneByReference(reference: string): Promise<Transaction | null> {
    return await this.transactionRepository.findOne({
      where: { reference },
    });
  }

  async create(data: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepository.create(data);
    await this.transactionRepository.save(transaction);
    return transaction;
  }
}
