import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class AttachPaymentMethodDto {
  @ApiProperty({
    description: 'Stripe payment method ID',
    example: 'pm_1NQe0t2eZvKYlo2C9bQ3Z8xF',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiProperty({
    description:
      'Set this payment method as the default (defaults to true if omitted)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  setAsDefault?: boolean;
}
