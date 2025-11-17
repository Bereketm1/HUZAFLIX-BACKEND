import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Id of the subscription plan' })
  @IsNotEmpty()
  @IsNumber()
  plan_id: number;

  @ApiProperty({ description: 'Id of the api' })
  @IsNotEmpty()
  @IsNumber()
  api_id: number;

  @ApiPropertyOptional({
    description: 'Auto renew subscription',
  })
  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean = true;
}
