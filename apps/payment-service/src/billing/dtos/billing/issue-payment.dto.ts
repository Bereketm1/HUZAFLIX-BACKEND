import { IsInt, Min } from 'class-validator';

export class IssuePaymentDto {
  @IsInt()
  @Min(50)
  amount: number; // in cents
}
