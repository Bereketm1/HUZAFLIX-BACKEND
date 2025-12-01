import { IsOptional, IsString, IsEnum, IsObject } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { EventType } from '../../entities/audit-log.entity';

export class CreateAuditLogDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: '42',
    description:
      'The internal id of the actor (user/service) that triggered the event',
  })
  actor_id?: string;

  @IsEnum(EventType)
  @ApiProperty({
    enum: EventType,
    example: EventType.API_KEY_CREATED,
    description: 'The event type (one of the EventType enum values)',
  })
  event!: EventType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'api_key',
    description:
      'Type of resource affected by the event, e.g. api_key, subscription, user',
  })
  resource_type?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: '10',
    description: 'ID of the resource (stringified bigint if applicable)',
  })
  resource_id?: string;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({
    example: { name: 'My API Key', api: { id: '1', name: 'Weather' } },
    description: 'Additional JSON metadata describing the event payload',
    type: 'object',
    additionalProperties: true,
  })
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: '203.0.113.8',
    description: 'IP address where the event originated',
  })
  ip_address?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    description: 'User-agent string (if available)',
  })
  user_agent?: string;
}
