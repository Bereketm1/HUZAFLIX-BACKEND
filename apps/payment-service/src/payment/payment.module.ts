import { CommonModule } from '@huzaflix/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRequestService } from './services/payment-request/payment-request.service';
import { TransactionsService } from './services/transactions/transactions.service';
import { PaymentRequestController } from './controller/payment-request/payment-request.controller';
import { TransactionController } from './controller/transaction/transaction.controller';
import { PaymentRequest } from './entities/payment-request.entity';
import { Transaction } from './entities/transaction.entity';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([PaymentRequest, Transaction]),
  ],
  providers: [PaymentRequestService, TransactionsService],
  controllers: [PaymentRequestController, TransactionController],
})
export class PaymentModule {}
