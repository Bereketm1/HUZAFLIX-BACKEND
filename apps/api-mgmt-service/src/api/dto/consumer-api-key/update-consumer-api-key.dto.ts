import { IsOptional, IsInt, IsISO8601, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConsumerApiKeyDto {
  @IsOptional()
  @IsISO8601()
  @ApiPropertyOptional({
    example: '2026-01-31T23:59:59Z',
    description:
      'New ISO8601 expiry datetime for the key. If omitted with expires_in_days, non-expiring is set.',
  })
  expires_at?: string;

  @IsOptional()
  @IsInt()
  @IsIn([30, 60, 90])
  @ApiPropertyOptional({
    example: 90,
    description:
      'Expiry in days. Used when expires_at is not provided. Allowed values: 30, 60, 90',
  })
  expires_in_days?: number;
}
