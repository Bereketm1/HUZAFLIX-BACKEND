import {
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsISO8601,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsumerApiKeyDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'My service key',
    description: 'Human-friendly name for the key',
  })
  name?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    example: 60,
    description: 'Requests per minute allowed for this key',
  })
  rate_limit_per_minute?: number;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    example: 1000,
    description: 'Daily quota for this key',
  })
  quota_daily?: number;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({
    example: 10000,
    description: 'Monthly quota for this key',
  })
  quota_monthly?: number;

  @IsOptional()
  @IsISO8601()
  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
    description: 'ISO8601 expiry date/time for the key',
  })
  expires_at?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    example: 1,
    description: 'Optional API id to scope the key to a single API',
  })
  api_id?: number;
}
