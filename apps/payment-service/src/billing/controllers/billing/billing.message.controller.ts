import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BillingService } from '../../services/billing/billing.service';

@Controller()
export class BillingMessageController {
  constructor(private readonly billingService: BillingService) {}

  @MessagePattern('deduct_credits')
  async deductCredits(
    @Payload() data: { userId: number; amount: number },
  ): Promise<boolean> {
    return await this.billingService.deductCredits(data.userId, data.amount);
  }
}
