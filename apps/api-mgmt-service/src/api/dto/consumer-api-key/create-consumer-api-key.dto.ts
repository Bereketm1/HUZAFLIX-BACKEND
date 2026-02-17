import {
  IsInt,
  IsISO8601,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsumerApiKeyDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'API id to scope the key to',
  })
  api_id: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'My service key',
    description: 'Human-friendly name for the key',
  })
  name?: string;

  @IsOptional()
  @IsISO8601()
  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59Z',
    description: 'ISO8601 expiry date/time for the key',
  })
  expires_at?: string;

  @IsOptional()
  @IsInt()
  @IsIn([30, 60, 90])
  @ApiPropertyOptional({
    example: 30,
    description:
      'Expiry in days. Used when expires_at is not provided. Allowed values: 30, 60, 90',
  })
  expires_in_days?: number;
}
