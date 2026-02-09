import { CommonModule } from '@huzaflix/common';
import { Module } from '@nestjs/common';
import { SubscriptionPlan } from './entities/plans.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanService } from './services/plan/plan.service';
import { PlanController } from './controllers/plan/plan.controller';
import { Subscription } from './entities/subscriptions.entity';
import { SubscriptionService } from './services/subscription/subscription.service';
import { SubscriptionController } from './controllers/subscription/subscription.controller';
import { SubscriptionMessageController } from './controllers/subscription/subscription.message.controller';
import { Api } from 'src/api/entities/api.entity';

import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, Subscription, Api]),
    CommonModule,
    ClientsModule.register([
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
      },
    ]),
  ],
  providers: [PlanService, SubscriptionService],
  exports: [PlanService],
  controllers: [
    PlanController,
    SubscriptionController,
    SubscriptionMessageController,
  ],
})
export class SubscriptionModule {}
