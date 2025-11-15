import { CommonModule } from '@huzaflix/common';
import { Module } from '@nestjs/common';
import { SubscriptionPlan } from './entities/plans.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanService } from './services/plan/plan.service';
import { PlanController } from './controllers/plan/plan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPlan]), CommonModule],
  providers: [PlanService],
  exports: [PlanService],
  controllers: [PlanController],
})
export class SubscriptionModule {}
