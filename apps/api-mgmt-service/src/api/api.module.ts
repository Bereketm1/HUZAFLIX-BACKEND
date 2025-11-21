import { CommonModule, MinioService } from '@huzaflix/common';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api } from './entities/api.entity';
import { ApiService } from './services/api/api.service';
import { ApiController } from './controllers/api/api.controller';
import { ApiKey } from './entities/api-key.entity';
import { PlanService } from 'src/subscription/services/plan/plan.service';
import { SubscriptionPlan } from 'src/subscription/entities/plans.entity';
import { FavouritesService } from './services/favourites/favourites.service';
import { Favourite } from './entities/favourites.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Api, ApiKey, SubscriptionPlan, Favourite]),
    CommonModule,
    ActivityLogModule,
  ],
  providers: [ApiService, MinioService, PlanService, FavouritesService],
  controllers: [ApiController],
  exports: [ApiService],
})
export class ApiModule {}
