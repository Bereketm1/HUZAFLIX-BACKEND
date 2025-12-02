import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  MaxLength,
} from 'class-validator';

export enum PaymentMethod {
  CARD = 'card',
  MTN_MOMO = 'mtn_momo',
  AIRTEL_MONEY = 'airtel_money',
}

export class CreateBillingInfoDto {
  @ApiProperty({ description: 'Full name of the user', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ description: 'Default payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  defaultPaymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Email of the user' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number of the user' })
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Country of the user', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: 'City of the user', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State/Province of the user',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: 'Address line 1', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({ description: 'Address line 2', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({ description: 'Postal code', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;
}
