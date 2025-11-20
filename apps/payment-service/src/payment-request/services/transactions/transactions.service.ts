import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from 'src/payment-request/dto/transaction/create-transaction.dto';
import { Transaction } from 'src/payment-request/entities/transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async create(
    data: CreateTransactionDto & { userId: number },
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create(data);
    await this.transactionRepository.save(transaction);
    return transaction;
  }
}
