import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SetDefaultPaymentMethodDto {
  @ApiProperty({
    description: 'Stripe payment method ID to set as default',
    example: 'pm_1NQe0t2eZvKYlo2C9bQ3Z8xF',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
