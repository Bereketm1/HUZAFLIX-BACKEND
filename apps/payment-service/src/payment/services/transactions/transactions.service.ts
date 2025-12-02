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
    }: {
      page?: number;
      limit?: number;
    },
    role?: string,
    userId?: number,
  ): Promise<{ data: Transaction[]; meta: PaginatedResponse } | Transaction[]> {
    const isAdmin = role === 'administrator';
    const isPaginated = page && limit;

    if (!isPaginated) {
      return isAdmin
        ? this.transactionRepository.find()
        : this.transactionRepository.find({ where: { userId: userId } });
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const where = isAdmin ? {} : { userId: userId };

    const [prs, total] = await this.transactionRepository.findAndCount({
      where,
      skip,
      take,
    });

    return paginate(prs, page, limit, total);
  }

  async findOneById(id: number, role?: string): Promise<Transaction> {
    const isAdmin = role === 'administrator';
    const where = isAdmin ? { id: id } : { id: id };

    const pr = await this.transactionRepository.findOne({
      where: where,
    });
    if (!pr) {
      throw new NotFoundException(`Transaction with id ${id} not found`);
    }
    return pr;
  }

  async create(
    data: CreateTransactionDto & { userId: number },
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create(data);
    await this.transactionRepository.save(transaction);
    return transaction;
  }
}
