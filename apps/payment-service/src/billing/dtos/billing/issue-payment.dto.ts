import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class IssuePaymentDto {
  @ApiProperty({
    description: 'Amount to charge in USD',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  amount: number; // in dollars
}
