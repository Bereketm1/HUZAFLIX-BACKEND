import { Module } from '@nestjs/common';
import { BillingController } from './controllers/billing/billing.controller';
import { BillingService } from './services/billing/billing.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@huzaflix/common';
import { Billing } from './entities/billing.entity';
import { Transaction } from 'src/payment/entities/transaction.entity';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [
    CommonModule,
    PaymentModule,
    TypeOrmModule.forFeature([Transaction, Billing]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
