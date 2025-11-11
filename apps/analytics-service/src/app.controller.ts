import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth } from '@nestjs/swagger';
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
    totalApiHits: number;
    totalSuccessHits: number;
    successRate: number;
    totalErrorHits: number;
    errorRate: number;
  } {
    // Mocked values; replace with real business logic later
    const totalApiHits = 1000;
    const totalSuccessHits = 920;
    const totalErrorHits = totalApiHits - totalSuccessHits;
    const successRate = Number(
      ((totalSuccessHits / totalApiHits) * 100).toFixed(2),
    );
    const errorRate = Number(
      ((totalErrorHits / totalApiHits) * 100).toFixed(2),
    );

    return {
      totalApiHits,
      totalSuccessHits,
      successRate,
      totalErrorHits,
      errorRate,
    };
  }

  @ApiBearerAuth()
  @Get('time-graph')
  @UseGuards(JwtAuthGuard)
  getTimeGraph(): Array<{ date: string; calls: number }> {
    // Mocked time-series data (as requested)
    return [
      { date: 'Apr 6', calls: 320 },
      { date: 'Apr 10', calls: 450 },
      { date: 'Apr 14', calls: 380 },
      { date: 'Apr 18', calls: 520 },
      { date: 'Apr 22', calls: 640 },
      { date: 'Apr 27', calls: 720 },
      { date: 'May 2', calls: 610 },
      { date: 'May 4', calls: 670 },
    ];
  }

  @ApiBearerAuth()
  @Get('latency-graph')
  @UseGuards(JwtAuthGuard)
  getLatencyGraph(): Array<{ date: string; latencyMs: number }> {
    // Mocked latency time-series data (milliseconds)
    return [
      { date: 'Apr 6', latencyMs: 120 },
      { date: 'Apr 10', latencyMs: 95 },
      { date: 'Apr 14', latencyMs: 110 },
      { date: 'Apr 18', latencyMs: 130 },
      { date: 'Apr 22', latencyMs: 140 },
      { date: 'Apr 27', latencyMs: 150 },
      { date: 'May 2', latencyMs: 135 },
      { date: 'May 4', latencyMs: 128 },
    ];
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
}
