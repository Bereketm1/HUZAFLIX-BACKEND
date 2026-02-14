import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billing } from 'src/billing/entities/billing.entity';
import { CreateBillingInfoDto } from 'src/billing/dtos/billing/create-billing.dto';
import { UpdateBillingInfoDto } from 'src/billing/dtos/billing/update-billing.dto';
import { stripe } from 'src/stripe/helper';
import Stripe from 'stripe';
import { IssuePaymentDto } from 'src/billing/dtos/billing/issue-payment.dto';
import { TransactionsService } from 'src/payment/services/transactions/transactions.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Billing)
    private readonly billingRepository: Repository<Billing>,
    private readonly transactionService: TransactionsService,
  ) {}

  // ──────────────────────────────────────────────
  //  BILLING PROFILE (one per user)
  // ──────────────────────────────────────────────

  async create(dto: CreateBillingInfoDto, userId: number): Promise<Billing> {
    this.assertStripeConfigured();

    const existing = await this.billingRepository.findOne({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException(
        'Billing profile already exists. Use PUT /billing to update it.',
      );
    }

    const billing = this.billingRepository.create({ ...dto, userId });
    const params: Stripe.CustomerCreateParams = {
      email: dto.email,
      name: dto.fullName,
      address: {
        line1: dto.addressLine1,
        line2: dto.addressLine2,
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

  async findByUserId(userId: number): Promise<Billing> {
    const billing = await this.billingRepository.findOne({
      where: { userId },
    });
    if (!billing) {
      throw new NotFoundException(
        'No billing profile found. Create one first via POST /billing.',
      );
    }
    return billing;
  }

  async update(userId: number, dto: UpdateBillingInfoDto): Promise<Billing> {
    const billing = await this.findByUserId(userId);
    Object.assign(billing, { ...dto, updatedAt: new Date() });
    return await this.billingRepository.save(billing);
  }

  async remove(userId: number): Promise<void> {
    const billing = await this.findByUserId(userId);

    if (billing.credits > 0) {
      throw new UnprocessableEntityException(
        `Cannot delete billing profile: credits must be 0 (current: ${billing.credits})`,
      );
    }

    await this.billingRepository.remove(billing);
  }

  async forceRemove(userId: number): Promise<void> {
    const billing = await this.findByUserId(userId);
    await this.billingRepository.remove(billing);
  }

  // ──────────────────────────────────────────────
  //  PAYMENT METHODS (multiple per profile)
  // ──────────────────────────────────────────────

  async listPaymentMethods(userId: number) {
    this.assertStripeConfigured();
    const billing = await this.findByUserId(userId);

    if (!billing.stripeCustomerId) {
      throw new UnprocessableEntityException(
        'No Stripe customer found for this billing profile',
      );
    }

    const methods = await stripe.paymentMethods.list({
      customer: billing.stripeCustomerId,
    });

    return {
      defaultPaymentMethodId:
        billing.stripePaymentMethodId || billing.defaultPaymentMethod || null,
      paymentMethods: methods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            }
          : null,
        created: pm.created,
      })),
    };
  }

  async attachPaymentMethod(
    paymentMethodId: string,
    userId: number,
    setAsDefault?: boolean,
  ) {
    this.assertStripeConfigured();
    if (!paymentMethodId) {
      throw new UnprocessableEntityException('No payment method provided');
    }

    const billing = await this.findByUserId(userId);

    if (!billing.stripeCustomerId) {
      throw new UnprocessableEntityException(
        'No Stripe customer found for this billing profile',
      );
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: billing.stripeCustomerId,
    });

    if (setAsDefault !== false) {
      billing.stripePaymentMethodId = paymentMethodId;
      billing.defaultPaymentMethod = paymentMethodId;
    }
    billing.updatedAt = new Date();

    await this.billingRepository.save(billing);

    return {
      message: 'Payment method attached successfully',
      paymentMethodId,
      isDefault: setAsDefault !== false,
    };
  }

  async detachPaymentMethod(paymentMethodId: string, userId: number) {
    this.assertStripeConfigured();
    const billing = await this.findByUserId(userId);

    await stripe.paymentMethods.detach(paymentMethodId);

    // If the detached method was the default, clear it
    if (billing.stripePaymentMethodId === paymentMethodId) {
      billing.stripePaymentMethodId = null;
    }
    if (billing.defaultPaymentMethod === paymentMethodId) {
      billing.defaultPaymentMethod = null;
    }
    billing.updatedAt = new Date();

    await this.billingRepository.save(billing);

    return { message: 'Payment method detached successfully', paymentMethodId };
  }

  async setDefaultPaymentMethod(paymentMethodId: string, userId: number) {
    this.assertStripeConfigured();
    const billing = await this.findByUserId(userId);

    billing.stripePaymentMethodId = paymentMethodId;
    billing.defaultPaymentMethod = paymentMethodId;
    billing.updatedAt = new Date();

    await this.billingRepository.save(billing);

    return {
      message: 'Default payment method updated',
      paymentMethodId,
    };
  }

  // ──────────────────────────────────────────────
  //  CHARGE / PAYMENTS
  // ──────────────────────────────────────────────

  async issuePayment(userId: number, dto: IssuePaymentDto) {
    this.assertStripeConfigured();
    const billing = await this.findByUserId(userId);

    if (!billing.stripeCustomerId) {
      throw new UnprocessableEntityException(
        'Billing profile does not have a Stripe customer configured',
      );
    }

    const paymentMethodId =
      dto.paymentMethodId ||
      billing.stripePaymentMethodId ||
      billing.defaultPaymentMethod;

    if (!paymentMethodId) {
      throw new UnprocessableEntityException(
        'No payment method provided and no default payment method configured',
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: this.dollarsToCents(dto.amount),
      currency: 'usd',
      customer: billing.stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        userId: userId.toString(),
        billingId: billing.id.toString(),
        credits: dto.amount.toString(),
      },
    });

    if (paymentIntent.status === 'succeeded') {
      await this.applyCreditsFromPaymentIntent(paymentIntent);
    }

    return {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      paymentMethodId,
    };
  }

  // ──────────────────────────────────────────────
  //  STRIPE WEBHOOK
  // ──────────────────────────────────────────────

  async handleStripeWebhook(event: Stripe.Event) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await this.applyCreditsFromPaymentIntent(paymentIntent);
    }
  }

  private async applyCreditsFromPaymentIntent(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const billingId = Number(paymentIntent.metadata?.billingId);
    const credits = Number(paymentIntent.metadata?.credits);

    if (!Number.isFinite(billingId) || !Number.isFinite(credits) || credits <= 0) {
      Logger.warn(
        `Skipping credit update for payment intent ${paymentIntent.id}: invalid metadata`,
      );
      return;
    }

    const billing = await this.billingRepository.findOne({
      where: { id: billingId },
    });

    if (!billing) {
      Logger.warn(
        `Skipping credit update for payment intent ${paymentIntent.id}: billing profile not found`,
      );
      return;
    }

    const transactionReference = `stripe:${paymentIntent.id}`;
    const existingTransaction =
      await this.transactionService.findOneByReference(transactionReference);
    if (existingTransaction) {
      return;
    }

    billing.credits += credits;
    await this.billingRepository.save(billing);
    await this.transactionService.create({
      reference: transactionReference,
      userId: billing.userId,
      amount: credits,
    });
  }

  // ──────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────

  private dollarsToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  private assertStripeConfigured(): void {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key === 'api_key_placeholder') {
      throw new UnprocessableEntityException(
        'Stripe secret key is not configured',
      );
    }
  }

  // ──────────────────────────────────────────────
  //  INTERNAL / MICROSERVICE METHODS
  // ──────────────────────────────────────────────

  async deductCredits(userId: number, amount: number): Promise<boolean> {
    // Avoid Stripe check for internal logic if we just want to use the credits
    // But if you want to ensure billing exists, we call findByUserId
    // findByUserId throws if not found, which is what we want.
    const billing = await this.findByUserId(userId);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Deduction amount must be a positive number');
    }

    const normalizedAmount = Math.round(amount);

    if (billing.credits < normalizedAmount) {
      return false;
    }

    billing.credits -= normalizedAmount;
    await this.billingRepository.save(billing);

    // Create a negative transaction record for history
    await this.transactionService.create({
      userId: billing.userId,
      amount: -normalizedAmount,
    });

    return true;
  }
}
