import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class AttachPaymentMethodDto {
  @ApiProperty({
    description: 'Billing profile ID to attach the payment method to',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  billingProfileId: number;

  @ApiProperty({
    description: 'Stripe payment method ID',
    example: 'pm_1NQe0t2eZvKYlo2C9bQ3Z8xF',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiProperty({
    description: 'Set this payment method as the default for the billing profile',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  setAsDefault?: boolean;
}
