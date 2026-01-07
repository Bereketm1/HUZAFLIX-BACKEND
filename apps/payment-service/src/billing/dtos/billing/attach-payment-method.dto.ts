import { IsString, IsNotEmpty } from 'class-validator';

export class AttachPaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
