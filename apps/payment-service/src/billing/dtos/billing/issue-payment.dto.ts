import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsOptional, IsString } from 'class-validator';

export class IssuePaymentDto {
  @ApiProperty({
    description: 'Billing profile ID to charge',
    example: 1,
  })
  @IsInt()
  billingProfileId: number;

  @ApiProperty({
    description: 'Amount to charge in USD',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  amount: number; // in dollars

  @ApiProperty({
    description:
      'Specific payment method ID to use (optional, uses default if not provided)',
    example: 'pm_1NQe0t2eZvKYlo2C9bQ3Z8xF',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}
