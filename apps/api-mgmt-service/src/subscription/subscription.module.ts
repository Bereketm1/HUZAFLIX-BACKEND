import { CommonModule } from '@huzaflix/common';
import { ActivityLogModule } from 'src/api/activity-log/activity-log.module';
import { Module } from '@nestjs/common';
import { SubscriptionPlan } from './entities/plans.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanService } from './services/plan/plan.service';
import { PlanController } from './controllers/plan/plan.controller';
import { Subscription } from './entities/subscriptions.entity';
import { SubscriptionService } from './services/subscription/subscription.service';
import { SubscriptionController } from './controllers/subscription/subscription.controller';
import { SubscriptionMessageController } from './controllers/subscription/subscription.message.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, Subscription]),
    CommonModule,
    ActivityLogModule,
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
