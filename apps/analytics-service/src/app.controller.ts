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
  @Get('user-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('adminstrator')
  async getUserStats(): Promise<unknown> {
    const stats: unknown = await this.dashboardClient
      .send('get_user_stats', {})
      .toPromise();
    return stats;
  }
}
