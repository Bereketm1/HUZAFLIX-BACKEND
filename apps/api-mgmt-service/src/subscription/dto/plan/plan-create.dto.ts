import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  Length,
  IsInt,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ description: 'Name of the subscription plan', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ description: 'Description of the subscription plan' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Monthly price of the plan' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  monthly_price: number;

  @ApiProperty({ description: 'Monthly call limit for the plan' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  monthly_call_limit: number;

  @ApiProperty({ description: 'Average price per call of the plan' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  avg_price_per_call: number;
}
