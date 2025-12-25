import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { AuditEvent } from '@huzaflix/common';

export class GetLogsQuery {
  @IsOptional()
  @IsEnum(AuditEvent)
  eventType?: AuditEvent;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
