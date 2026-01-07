import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '@huzaflix/common';
import { paginate } from '@huzaflix/common';
import { Billing } from 'src/billing/entities/billing.entity';
import { CreateBillingInfoDto } from 'src/billing/dtos/billing/create-billing.dto';
import { UpdateBillingInfoDto } from 'src/billing/dtos/billing/update-billing.dto';
import { stripe } from 'src/stripe/helper';
import Stripe from 'stripe';
import { IssuePaymentDto } from 'src/billing/dtos/billing/issue-payment.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing)
    private readonly billingRepository: Repository<Billing>,
  ) {}

  async create(dto: CreateBillingInfoDto, userId: number): Promise<Billing> {
    const billing = this.billingRepository.create({ ...dto, userId });
    const params: Stripe.CustomerCreateParams = {
      email: dto.email,
      name: dto.fullName,
      address: {
        line1: dto.addressLine1,
        line2: dto.addressLine1,
        country: dto.country,
        city: dto.city,
        postal_code: dto.postalCode,
        state: dto.state,
      },
      phone: dto.phoneNumber,
    };
    const stripeData = await stripe.customers.create(params);
    Logger.log(stripeData);
    if (!stripeData) {
      throw new UnprocessableEntityException('Unable to process billing info');
    }
    return await this.billingRepository.save({
      ...billing,
      stripeCustomerId: stripeData.id || undefined,
    });
  }

  async attachPaymentMethod(paymentMethodId: string, userId: number) {
    if (!paymentMethodId) {
      throw new UnprocessableEntityException('No payment method issued');
    }

    const billing = await this.billingRepository.findOne({
      where: { userId },
    });

    if (!billing || !billing.stripeCustomerId) {
      throw new UnprocessableEntityException(
        'No billing profile or Stripe customer found for user',
      );
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: billing.stripeCustomerId,
    });

    Object.assign(billing, {
      stripePaymentMethodId: paymentMethodId,
      updatedAt: new Date(),
    });

    await this.billingRepository.save(billing);

    return {
      message: 'Payment method attached successfully',
    };
  }

  async findAll({
    userId,
    page,
    limit,
  }: {
    userId: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: Billing[]; meta: PaginatedResponse } | Billing[]> {
    if (!page || !limit) {
      return this.billingRepository.find();
    }
    const [billingProfiles, total] = await this.billingRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(billingProfiles, page, limit, total);
  }

  async findOneById(id: number, userId: number): Promise<Billing> {
    const billing = await this.billingRepository.findOne({
      where: { id, userId },
    });
    if (!billing)
      throw new NotFoundException(`Billing info with ID ${id} not found`);
    return billing;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateBillingInfoDto,
  ): Promise<Billing> {
    const billing = await this.findOneById(id, userId);
    Object.assign(billing, { ...dto, updatedAt: new Date() });
    return await this.billingRepository.save(billing);
  }

  async remove(id: number, userId: number): Promise<void> {
    const billing = await this.findOneById(id, userId);

    if (billing.credits > 0) {
      throw new UnprocessableEntityException(
        `Cannot delete billing info: credits must be 0 (current credits: ${billing.credits})`,
      );
    }

    await this.billingRepository.remove(billing);
  }

  async forceRemove(id: number, userId: number): Promise<void> {
    const billing = await this.findOneById(id, userId);
    await this.billingRepository.remove(billing);
  }

  async issuePayment(userId: number, dto: IssuePaymentDto) {
    const billing = await this.billingRepository.findOne({
      where: { userId },
    });

    if (
      !billing ||
      !billing.stripeCustomerId ||
      !billing.stripePaymentMethodId
    ) {
      throw new UnprocessableEntityException(
        'Billing profile or payment method not configured',
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: this.dollarsToCents(dto.amount),
      currency: 'usd',
      customer: billing.stripeCustomerId,
      payment_method: billing.stripePaymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        userId: userId.toString(),
        billingId: billing.id.toString(),
        credits: dto.amount.toString(),
      },
    });

    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  }

  async handleStripeWebhook(event: Stripe.Event) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const billingId = parseInt(paymentIntent.metadata.billingId);
      const credits = parseInt(paymentIntent.metadata.credits);

      const billing = await this.billingRepository.findOne({
        where: { id: billingId },
      });

      if (!billing) return;

      billing.credits += credits;
      await this.billingRepository.save(billing);
    }
  }

  private dollarsToCents(amount: number): number {
    return Math.round(amount * 100);
  }
}
