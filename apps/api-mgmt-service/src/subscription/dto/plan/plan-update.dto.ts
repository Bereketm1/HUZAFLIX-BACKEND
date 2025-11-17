import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  Length,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { PlanType } from 'src/subscription/entities/plans.entity';

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({
    description: 'Name of the subscription plan',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the subscription plan',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of the subscription plan',
  })
  @IsEnum(PlanType)
  @IsOptional()
  plan_type?: PlanType;

  @ApiPropertyOptional({
    description: 'Monthly price of the plan',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  monthly_price?: number;

  @ApiPropertyOptional({
    description: 'Yearly price of the plan',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  yearly_price?: number;

  @ApiPropertyOptional({
    description: 'Daily call limit for the plan',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  daily_call_limit?: number;

  @ApiPropertyOptional({
    description: 'Monthly call limit for the plan',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  monthly_call_limit?: number;

  @ApiPropertyOptional({ description: 'Yearly call limit for the plan' })
  @IsInt()
  @Min(1)
  @IsOptional()
  yearly_call_limit?: number;

  @ApiPropertyOptional({
    description: 'Average price per call of the plan',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  avg_price_per_call?: number;
}
