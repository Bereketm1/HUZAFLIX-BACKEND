import { CommonModule, MinioService } from '@huzaflix/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api } from './entities/api.entity';
import { ApiService } from './services/api/api.service';
import { ApiController } from './controllers/api/api.controller';
import { ApiKey } from './entities/api-key.entity';
import { PlanService } from 'src/subscription/services/plan/plan.service';
import { SubscriptionPlan } from 'src/subscription/entities/plans.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Api, ApiKey, SubscriptionPlan]),
    CommonModule,
  ],
  providers: [ApiService, MinioService, PlanService],
  controllers: [ApiController],
  exports: [ApiService],
})
export class ApiModule {}
