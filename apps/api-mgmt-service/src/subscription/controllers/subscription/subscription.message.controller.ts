import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SubscriptionService } from 'src/subscription/services/subscription/subscription.service';

@Controller()
export class SubscriptionMessageController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @MessagePattern('get_subscription_by_user_id')
  async getUserById(@Payload() payload: { userId: number }) {
    return await this.subscriptionService.findByUserId(payload.userId);
  }
}
