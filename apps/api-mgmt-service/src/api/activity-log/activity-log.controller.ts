import { Controller, Get, Query, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@huzaflix/common';
import { ActivityLogService } from './activity-log.service';

@ApiTags('activity')
@Controller('activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get logs for current user' })
  @ApiResponse({ status: 200, description: 'Fetched user logs successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findForUser(@Req() req, @Query('page') page?: number, @Query('limit') limit?: number) {
    // Accept either req.id (used by unit tests) or req.user.id from JwtAuthGuard
    const userId = req.id ?? req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('Invalid user');
    }

    return await this.activityLogService.findForUser({ page, limit }, userId);
  }
}
