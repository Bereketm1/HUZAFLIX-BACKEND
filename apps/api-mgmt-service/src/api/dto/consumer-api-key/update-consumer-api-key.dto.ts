import { IsOptional, IsString, IsInt, IsISO8601 } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConsumerApiKeyDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'My updated key',
    description: 'Updated human-friendly name for the key',
  })
  name?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    example: 120,
    description: 'Updated rate limit per minute',
  })
  rate_limit_per_minute?: number;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ example: 2000, description: 'Updated daily quota' })
  quota_daily?: number;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ example: 20000, description: 'Updated monthly quota' })
  quota_monthly?: number;

  @IsOptional()
  @IsISO8601()
  @ApiPropertyOptional({
    example: '2026-01-31T23:59:59Z',
    description: 'New ISO8601 expiry datetime for the key (nullable)',
  })
  expires_at?: string | null;
}
