import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '@huzaflix/common';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('DASHBOARD_SERVICE') private readonly dashboardClient: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiBearerAuth()
  @Get('report')
  @UseGuards(JwtAuthGuard)
  getApiReport(): {
    totalApiHitsToday: {
      value: number;
      percentage: number;
      change: string;
      period: string;
    };
    totalApiPublished: {
      value: number;
      percentage: number;
      change: string;
      period: string;
    };
    totalRevenueThisMonth: {
      value: number;
      percentage: number;
      change: string;
      period: string;
    };
    totalSuccessHits: number;
    successRate: number;
    totalErrorHits: number;
    errorRate: number;
  } {
    // Mocked values; replace with real business logic later
    const totalApiHitsToday = {
      value: 1000,
      percentage: 15,
      change: 'increase',
      period: 'daily',
    };

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

    const totalSuccessHits = 920;
    const totalErrorHits = totalApiHitsToday.value - totalSuccessHits;
    const successRate = Number(
      ((totalSuccessHits / totalApiHitsToday.value) * 100).toFixed(2),
    );
    const errorRate = Number(
      ((totalErrorHits / totalApiHitsToday.value) * 100).toFixed(2),
    );

    return {
      totalRevenueThisMonth,
      totalApiHitsToday,
      totalApiPublished,
      totalSuccessHits,
      successRate,
      totalErrorHits,
      errorRate,
    };
  }

  @ApiBearerAuth()
  @Get('time-graph')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getTimeGraph(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Array<{ date: string; calls: number }> {
    // Mocked time-series data (as requested)
    const data = [
      { date: 'Apr 6', calls: 320 },
      { date: 'Apr 10', calls: 450 },
      { date: 'Apr 14', calls: 380 },
      { date: 'Apr 18', calls: 520 },
      { date: 'Apr 22', calls: 640 },
      { date: 'Apr 27', calls: 720 },
      { date: 'May 2', calls: 610 },
      { date: 'May 4', calls: 670 },
    ];

    return this.filterByDateRange(data, startDate, endDate);
  }

  @ApiBearerAuth()
  @Get('latency-graph')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getLatencyGraph(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Array<{ date: string; latencyMs: number }> {
    // Mocked latency time-series data (milliseconds)
    const data = [
      { date: 'Apr 6', latencyMs: 120 },
      { date: 'Apr 10', latencyMs: 95 },
      { date: 'Apr 14', latencyMs: 110 },
      { date: 'Apr 18', latencyMs: 130 },
      { date: 'Apr 22', latencyMs: 140 },
      { date: 'Apr 27', latencyMs: 150 },
      { date: 'May 2', latencyMs: 135 },
      { date: 'May 4', latencyMs: 128 },
    ];

    return this.filterByDateRange(data, startDate, endDate);
  }

  @ApiBearerAuth()
  @Get('user-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  async getUserStats(): Promise<unknown> {
    const stats: unknown = await this.dashboardClient
      .send('get_user_stats', {})
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
