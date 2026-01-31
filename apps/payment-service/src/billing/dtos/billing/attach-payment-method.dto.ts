import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AttachPaymentMethodDto {
  @ApiProperty({
    description: 'Stripe payment method ID',
    example: 'pm_1NQe0t2eZvKYlo2C9bQ3Z8xF',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
