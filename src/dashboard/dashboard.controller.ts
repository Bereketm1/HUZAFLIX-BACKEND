import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('user-stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'Fetched user statistics successfully',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  async getUserStats() {
    const total = await this.dashboardService.totalUsers();
    const today = await this.dashboardService.newUsersToday();
    const week = await this.dashboardService.newUsersThisWeek();
    const month = await this.dashboardService.newUsersThisMonth();
    const latest = await this.dashboardService.latestUsers();

    return {
      total,
      today,
      week,
      month,
      latest,
    };
  }
}
