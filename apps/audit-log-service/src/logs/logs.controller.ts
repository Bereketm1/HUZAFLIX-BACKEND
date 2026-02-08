import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request } from 'express';
import { LogsService } from './logs.service';
import { CreateLogDto } from './dto/create-log.dto';
import { GetMyLogsQuery } from './dto/get-my-logs.query';
import { IngestApiKeyGuard } from './guards/ingest-api-key.guard';
import { JwtAuthGuard } from '@huzaflix/common';
import { buildActivityMessage } from './activity-message';

@Controller()
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  // Ingestion endpoint (best-effort from gateway)
  @UseGuards(IngestApiKeyGuard)
  @ApiExcludeEndpoint()
  @Post('logs')
  async ingest(@Body() dto: CreateLogDto) {
    return await this.logs.create(dto);
  }

  // Authenticated user's activity logs
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('logs')
  async getMyLogs(
    @Req() req: Request & { user?: { id?: number | string } },
    @Query() query: GetMyLogsQuery,
  ) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    const userId = req.user?.id;

    const result = await this.logs.find({
      eventType: query.eventType,
      userId: userId != null ? String(userId) : undefined,
      startDate,
      endDate,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    });

    if (Array.isArray(result)) {
      return result.map((log) => ({
        ...log,
        activityMessage: buildActivityMessage(log),
      }));
    }

    return {
      ...result,
      data: result.data.map((log) => ({
        ...log,
        activityMessage: buildActivityMessage(log),
      })),
    };
  }
}
