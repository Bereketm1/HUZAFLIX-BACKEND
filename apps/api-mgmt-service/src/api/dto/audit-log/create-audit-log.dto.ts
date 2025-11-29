import { IsOptional, IsString, IsEnum, IsObject } from 'class-validator';
import { EventType } from '../../entities/audit-log.entity';

export class CreateAuditLogDto {
  @IsOptional()
  @IsString()
  actor_id?: string;

  @IsEnum(EventType)
  event!: EventType;

  @IsOptional()
  @IsString()
  resource_type?: string;

  @IsOptional()
  @IsString()
  resource_id?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}
