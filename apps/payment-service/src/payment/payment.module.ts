import { CommonModule } from '@huzaflix/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './services/transactions/transactions.service';
import { TransactionController } from './controller/transaction/transaction.controller';
import { Transaction } from './entities/transaction.entity';

@Module({
  imports: [CommonModule, TypeOrmModule.forFeature([Transaction])],
  providers: [TransactionsService],
  controllers: [TransactionController],
  exports: [TransactionsService],
})
export class PaymentModule {}
