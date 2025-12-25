import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AuditActor, AuditEvent } from '@huzaflix/common';

export class CreateLogDto {
  @IsOptional()
  @IsISO8601()
  timestamp?: string;

  @IsEnum(AuditActor)
  actor!: AuditActor;

  @IsEnum(AuditEvent)
  event!: AuditEvent;

  @IsInt()
  @Min(100)
  @Max(599)
  status!: number;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
