import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../../entities/audit-log.entity';

export class CreateAuditDto {
  @ApiProperty({ example: '123' })
  actor_id: string;

  @ApiProperty({ enum: EventType })
  event: EventType | string;

  @ApiPropertyOptional({ example: 'user' })
  resource_type?: string;

  @ApiPropertyOptional({ example: '42' })
  resource_id?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '127.0.0.1' })
  ip_address?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0' })
  user_agent?: string;
}
