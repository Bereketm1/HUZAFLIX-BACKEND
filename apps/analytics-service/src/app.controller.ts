import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AnalyticsService } from './analytics/services/analytics.service';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '@huzaflix/common';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('DASHBOARD_SERVICE') private readonly dashboardClient: ClientProxy,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiBearerAuth()
  @Get('report')
  @UseGuards(JwtAuthGuard)
  async getApiReport() {
    const stats = await this.analyticsService.getDailyStats();

    // Default/Mock values for other fields not yet tracked in DB
    const totalApiPublished = {
      value: 100,
      percentage: 10,
      change: 'increase',
      period: 'daily',
    };

    const totalRevenueThisMonth = {
      value: 1200,
      percentage: 20,
      change: 'increase',
      period: 'monthly',
    };

    const successRate =
      stats.totalApiHitsToday.value > 0
        ? Number(
            (
              (stats.totalSuccessHits / stats.totalApiHitsToday.value) *
              100
            ).toFixed(2),
          )
        : 0;

    const errorRate =
      stats.totalApiHitsToday.value > 0
        ? Number(
            (
              (stats.totalErrorHits / stats.totalApiHitsToday.value) *
              100
            ).toFixed(2),
          )
        : 0;

    // fetch total users from dashboard microservice (typed)
    const userStats = await this.dashboardClient
      .send<{
        total?: number;
        totalUsers?: number;
        users?: number;
        active?: number;
      }>('get_user_stats', {})
      .toPromise();

    return {
      totalRevenueThisMonth,
      totalApiHitsToday: stats.totalApiHitsToday,
      totalApiPublished,
      totalSuccessHits: stats.totalSuccessHits,
      successRate,
      totalErrorHits: stats.totalErrorHits,
      errorRate,
      totalUsers: userStats?.total ?? userStats?.totalUsers ?? null,
    };
  }

  @ApiBearerAuth()
  @Get('health')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getSystemHealth(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.analyticsService.getSystemHealth(startDate, endDate);
  }

  @ApiBearerAuth()
  @Get('api-health')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getApiHealth(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.analyticsService.getApiHealth(startDate, endDate);
  }

  @ApiBearerAuth()
  @Get('time-graph')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getTimeGraph(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Array<{ date: string; calls: number }>> {
    return this.analyticsService.getTimeGraph(startDate, endDate);
  }

  @ApiBearerAuth()
  @Get('latency-graph')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getLatencyGraph(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Array<{ date: string; latencyMs: number }>> {
    return this.analyticsService.getLatencyGraph(startDate, endDate);
  }

  @ApiBearerAuth()
  @Get('user-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  async getUserStats(): Promise<unknown> {
    const stats = await this.dashboardClient
      .send<{
        total?: number;
        totalUsers?: number;
        users?: number;
        active?: number;
      }>('get_user_stats', {})
      .toPromise();
    return stats;
  }

  private filterByDateRange<T extends { date: string }>(
    data: T[],
    startDate?: string,
    endDate?: string,
  ): T[] {
    if (!startDate && !endDate) return data;

    const start = startDate
      ? this.parseDate(startDate, 'startDate')
      : undefined;
    const end = endDate ? this.parseDate(endDate, 'endDate') : undefined;
    const year = new Date().getFullYear();

    return data.filter((item) => {
      const itemDate = new Date(`${item.date} ${year}`);
      if (Number.isNaN(itemDate.getTime())) return false;
      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;
      return true;
    });
  }

  private parseDate(value: string, label: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${label}`);
    }
    return date;
  }
}
