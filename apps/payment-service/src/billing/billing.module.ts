import { Module } from '@nestjs/common';
import { BillingController } from './controllers/billing/billing.controller';
import { BillingService } from './services/billing/billing.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@huzaflix/common';
import { Billing } from './entities/billing.entity';
import { PaymentRequest } from 'src/payment/entities/payment-request.entity';
import { Transaction } from 'src/payment/entities/transaction.entity';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([PaymentRequest, Transaction, Billing]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
