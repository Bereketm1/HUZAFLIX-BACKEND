import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentRequestDto {
  @ApiProperty({ description: 'Amount for the payment request' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({
    description: 'Additional remark for the payment request',
  })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({
    description: 'Payment method used (e.g. telebirr, mpesa)',
  })
  @IsString()
  @IsOptional()
  method: string;
}
