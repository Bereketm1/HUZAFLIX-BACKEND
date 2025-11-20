import {
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  IsPositive,
} from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  remote_reference: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsNumber()
  payment_request_id: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
