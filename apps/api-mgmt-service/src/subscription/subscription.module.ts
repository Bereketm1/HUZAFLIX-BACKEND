import { CommonModule } from '@huzaflix/common';
import { Module } from '@nestjs/common';
import { SubscriptionPlan } from './entities/plans.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanService } from './services/plan/plan.service';
import { PlanController } from './controllers/plan/plan.controller';
import { Subscription } from './entities/subscriptions.entity';
import { SubscriptionService } from './services/subscription/subscription.service';
import { SubscriptionController } from './controllers/subscription/subscription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, Subscription]),
    CommonModule,
  ],
  providers: [PlanService, SubscriptionService],
  exports: [PlanService],
  controllers: [PlanController, SubscriptionController],
})
export class SubscriptionModule {}
