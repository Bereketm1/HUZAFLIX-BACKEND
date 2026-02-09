import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from '../services/analytics.service';
import { ApiRequestLog } from '../entities/api-request-log.entity';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @EventPattern('log_api_request')
  async handleApiRequestLog(@Payload() data: Partial<ApiRequestLog>) {
    await this.analyticsService.logRequest(data);
  }
}
