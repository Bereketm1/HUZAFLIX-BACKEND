import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardMessageController {
  constructor(private readonly dashboardService: DashboardService) {}

  @MessagePattern('get_user_stats')
  async getUserStats() {
    const stats = await this.dashboardService.getAggregatedStat();
    return stats;
  }
}
