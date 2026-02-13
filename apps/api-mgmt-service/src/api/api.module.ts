import { CommonModule, MinioService } from '@huzaflix/common';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Api } from './entities/api.entity';
import { ApiService } from './services/api/api.service';
import { ConsumerApiKeyModule } from './consumer-api-key.module';
import { ApiController } from './controllers/api/api.controller';
import { ApiKey } from './entities/api-key.entity';
import { PlanService } from 'src/subscription/services/plan/plan.service';
import { SubscriptionPlan } from 'src/subscription/entities/plans.entity';
import { FavouritesService } from './services/favourites/favourites.service';
import { Favourite } from './entities/favourites.entity';
import { Subscription } from 'src/subscription/entities/subscriptions.entity';
import { AuditLogClient } from './services/metrics/audit-log.client';

import { ApiUsageController } from './controllers/api-usage/api-usage.controller';
import { ApiUsageService } from './services/api-usage/api-usage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Api,
      ApiKey,
      SubscriptionPlan,
      Favourite,
      Subscription,
    ]),
    CommonModule,
    ConsumerApiKeyModule,
  ],
  providers: [
    ApiService,
    MinioService,
    PlanService,
    FavouritesService,
    ApiUsageService,
    AuditLogClient
  ],
  controllers: [ApiController, ApiUsageController],
  exports: [ApiService],
})
export class ApiModule {}
