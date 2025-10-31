import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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

  @ApiTags('analytics')
  @ApiBearerAuth()
  @Get('user-stats')
  async getUserStats(): Promise<unknown> {
    const stats: unknown = await this.dashboardClient
      .send('get_user_stats', {})
      .toPromise();
    return stats;
  }
}
