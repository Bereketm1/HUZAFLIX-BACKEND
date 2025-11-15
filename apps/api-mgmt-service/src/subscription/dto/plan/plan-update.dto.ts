import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  Length,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({
    description: 'Name of the subscription plan',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the subscription plan' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Monthly price of the plan',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  monthly_price?: number;

  @ApiPropertyOptional({
    description: 'Monthly call limit for the plan',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  monthly_call_limit?: number;

  @ApiPropertyOptional({
    description: 'Average price per call of the plan',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  avg_price_per_call?: number;
}
