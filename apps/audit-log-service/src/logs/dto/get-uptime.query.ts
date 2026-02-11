import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class GetUptimeQuery {
  @IsString()
  basePath!: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
