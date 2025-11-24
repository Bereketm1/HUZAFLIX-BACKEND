import { IsOptional, IsString, IsInt, IsISO8601 } from 'class-validator';

export class UpdateConsumerApiKeyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  rate_limit_per_minute?: number;

  @IsOptional()
  @IsInt()
  quota_daily?: number;

  @IsOptional()
  @IsInt()
  quota_monthly?: number;

  @IsOptional()
  @IsISO8601()
  expires_at?: string | null;
}
