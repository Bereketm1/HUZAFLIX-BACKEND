import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { AuditEvent } from '@huzaflix/common';

export class GetMyLogsQuery {
  @IsOptional()
  @IsEnum(AuditEvent)
  eventType?: AuditEvent;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}