import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { Billing } from 'src/billing/entities/billing.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionsService } from 'src/payment/services/transactions/transactions.service';
import Stripe from 'stripe';

describe('BillingService', () => {
  let service: BillingService;

  const mockBillingRepository: Partial<Repository<Billing>> = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTransactionService = {
    create: jest.fn(),
    findOneByReference: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getRepositoryToken(Billing),
          useValue: mockBillingRepository,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deductCredits', () => {
    it('should deduct credits if balance is sufficient', async () => {
      const billing = {
        userId: 1,
        credits: 100,
      } as Billing;

      // Mock findOne to return the billing
      mockBillingRepository.findOne = jest.fn().mockResolvedValue(billing);
      // Mock save to return saved entity
      mockBillingRepository.save = jest
        .fn()
        .mockImplementation((b) => Promise.resolve(b));
      // Mock transaction create
      mockTransactionService.create = jest.fn().mockResolvedValue({});

      const result = await service.deductCredits(1, 50);

      expect(result).toBe(true);
      expect(billing.credits).toBe(50);
      expect(mockBillingRepository.save).toHaveBeenCalledWith(billing);
      expect(mockTransactionService.create).toHaveBeenCalledWith({
        userId: 1,
        amount: -50,
      });
    });

    it('should normalize decimal amount before deducting', async () => {
      const billing = {
        userId: 1,
        credits: 100,
      } as Billing;

      mockBillingRepository.findOne = jest.fn().mockResolvedValue(billing);
      mockBillingRepository.save = jest
        .fn()
        .mockImplementation((b) => Promise.resolve(b));
      mockTransactionService.create = jest.fn().mockResolvedValue({});

      const result = await service.deductCredits(1, 9.6);

      expect(result).toBe(true);
      expect(billing.credits).toBe(90);
      expect(mockTransactionService.create).toHaveBeenCalledWith({
        userId: 1,
        amount: -10,
      });
    });

    it('should return false if balance is insufficient', async () => {
      const billing = {
        userId: 1,
        credits: 10,
      } as Billing;

      mockBillingRepository.findOne = jest.fn().mockResolvedValue(billing);

      const result = await service.deductCredits(1, 50);

      expect(result).toBe(false);
      expect(billing.credits).toBe(10); // Should verify credits not changed
      // Should NOT save if insufficient
      expect(mockBillingRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionService.create).not.toHaveBeenCalled();
    });
  });

  describe('handleStripeWebhook', () => {
    it('should apply credits for succeeded payment intent webhook', async () => {
      const billing = {
        id: 5,
        userId: 2,
        credits: 10,
      } as Billing;

      mockBillingRepository.findOne = jest.fn().mockResolvedValue(billing);
      mockBillingRepository.save = jest
        .fn()
        .mockImplementation((b) => Promise.resolve(b));
      mockTransactionService.findOneByReference = jest
        .fn()
        .mockResolvedValue(null);
      mockTransactionService.create = jest.fn().mockResolvedValue({});

      const paymentIntent = {
        id: 'pi_test_1',
        metadata: {
          billingId: '5',
          credits: '25',
        },
      } as Stripe.PaymentIntent;

      const event: Stripe.Event = {
        type: 'payment_intent.succeeded',
        data: {
          object: paymentIntent,
        },
      } as Stripe.Event;

      await service.handleStripeWebhook(event);

      expect(billing.credits).toBe(35);
      expect(mockTransactionService.findOneByReference).toHaveBeenCalledWith(
        'stripe:pi_test_1',
      );
      expect(mockTransactionService.create).toHaveBeenCalledWith({
        reference: 'stripe:pi_test_1',
        userId: 2,
        amount: 25,
      });
    });

    it('should not re-apply credits when transaction reference already exists', async () => {
      const billing = {
        id: 5,
        userId: 2,
        credits: 10,
      } as Billing;

      mockBillingRepository.findOne = jest.fn().mockResolvedValue(billing);
      mockTransactionService.findOneByReference = jest
        .fn()
        .mockResolvedValue({ id: 99 });

      const paymentIntent = {
        id: 'pi_test_2',
        metadata: {
          billingId: '5',
          credits: '25',
        },
      } as Stripe.PaymentIntent;

      const event: Stripe.Event = {
        type: 'payment_intent.succeeded',
        data: {
          object: paymentIntent,
        },
      } as Stripe.Event;

      await service.handleStripeWebhook(event);

      expect(mockBillingRepository.save).not.toHaveBeenCalled();
      expect(mockTransactionService.create).not.toHaveBeenCalled();
    });
  });
});
