import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@huzaflix/common';
import type { Request } from 'express';
import type { AuditLog } from '../entities/audit-log.entity';
import type { DeepPartial } from 'typeorm';
import { CreateAuditLogDto } from '../dto/audit-log/create-audit-log.dto';
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
  async findForUser(
    @CurrentUser() user?: { id?: number },
    @Req() req?: Request & { id?: number | string },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Accept either the value exposed by JwtAuthGuard via @CurrentUser or
    // tests that set a top-level `req.id` value.
    const userId = user?.id ?? req?.id;

    if (!userId) {
      throw new UnauthorizedException('Invalid user');
    }

    return await this.activityLogService.findForUser({ page, limit }, userId);
  }

  // Internal endpoint intended for other services to create audit entries.
  // Note: this is intentionally not guarded to allow internal service-to-service calls
  @Post('internal')
  async createInternal(@Body() dto: CreateAuditLogDto) {
    return await this.activityLogService.createAudit(
      dto as DeepPartial<AuditLog>,
    );
  }
}
