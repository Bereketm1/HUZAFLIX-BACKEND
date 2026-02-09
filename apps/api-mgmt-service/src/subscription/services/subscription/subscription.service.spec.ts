import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaginatedResponse } from '@huzaflix/common';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/subscription/entities/subscriptions.entity';
import { SubscriptionPlan } from 'src/subscription/entities/plans.entity';
import { Api } from 'src/api/entities/api.entity';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  const mockSubscriptionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockPlanRepository: Partial<Repository<SubscriptionPlan>> = {
    findOne: jest.fn(),
  };

  const mockApiRepository = {
    findOne: jest.fn(),
  };

  const mockPaymentClient = {
    send: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue(true),
    })),
  };

  let testingModule: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    testingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockPlanRepository,
        },
        {
          provide: getRepositoryToken(Api),
          useValue: mockApiRepository,
        },
        {
            provide: 'PAYMENT_SERVICE',
            useValue: mockPaymentClient,
        },
      ],
    }).compile();

    service = testingModule.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a subscription', async () => {
      const plan = { id: 1, monthly_call_limit: 10, monthly_price: 10, plan_type: 'monthly' } as unknown as SubscriptionPlan;
      const api = { id: 1 } as Api;
      mockPlanRepository.findOne = jest.fn(() => Promise.resolve(plan));
      mockApiRepository.findOne = jest.fn(() => Promise.resolve(api));

      const subscription = {
        user_id: 1,
        plan_id: plan.id,
        api_id: 1,
        auto_renew: true,
        calls_used_this_cycle: 0,
      } as Subscription;

      mockSubscriptionRepository.create = jest.fn(() => subscription);
      mockSubscriptionRepository.save = jest.fn(() =>
        Promise.resolve(subscription),
      );

      const result = await service.create({ plan_id: 1, api_id: 1 }, 1);

      expect(mockPlanRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(mockApiRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      // Verify payment client was called
      expect(mockPaymentClient.send).toHaveBeenCalledWith('deduct_credits', {
        userId: 1,
        amount: 10,
      });

      expect(mockSubscriptionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          plan_id: 1,
          status: SubscriptionStatus.ACTIVE,
        }),
      );
      expect(result).toEqual(subscription);
    });

    it('should throw BadRequestException if insufficient credits', async () => {
      const plan = { id: 1, monthly_price: 100, plan_type: 'monthly' } as any;
      const api = { id: 1 } as Api;
      mockPlanRepository.findOne = jest.fn(() => Promise.resolve(plan));
      mockApiRepository.findOne = jest.fn(() => Promise.resolve(api));

      // Mock payment failures
      mockPaymentClient.send = jest.fn(() => ({
          toPromise: jest.fn().mockResolvedValue(false),
      }));

      await expect(service.create({ plan_id: 1, api_id: 1 }, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if plan does not exist', async () => {
      mockPlanRepository.findOne = jest.fn(() => Promise.resolve(null));

      await expect(
        service.create({ plan_id: 999, api_id: 1 }, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all subscriptions for admin when not paginated', async () => {
      const subscriptions = [{ id: 1 }, { id: 2 }];
      mockSubscriptionRepository.find = jest.fn(() =>
        Promise.resolve(subscriptions),
      );

      const result = await service.findAll({}, 1, 'administrator');

      expect(result).toEqual(subscriptions);
      expect(mockSubscriptionRepository.find).toHaveBeenCalledWith({
        relations: ['plan'],
      });
    });

    it('should return subscriptions for user when not paginated', async () => {
      const subscriptions = [{ id: 1 }];
      mockSubscriptionRepository.find = jest.fn(() =>
        Promise.resolve(subscriptions),
      );

      const result = await service.findAll({}, 1, 'user');

      expect(result).toEqual(subscriptions);
      expect(mockSubscriptionRepository.find).toHaveBeenCalledWith({
        where: { user_id: 1 },
        relations: ['plan'],
      });
    });

    it('should return paginated subscriptions', async () => {
      const subscriptions = [{ id: 1 }];
      mockSubscriptionRepository.findAndCount = jest.fn(() =>
        Promise.resolve([subscriptions, 3]),
      );

      const result = (await service.findAll(
        { page: 1, limit: 1 },
        1,
        'user',
      )) as { data: Subscription[]; meta: PaginatedResponse };

      expect(mockSubscriptionRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 1,
        where: { user_id: 1, status: SubscriptionStatus.ACTIVE },
        relations: ['plan'],
      });
      expect(result.data).toEqual(subscriptions);
      expect(result.meta.totalItems).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a subscription if found', async () => {
      const subscription = { id: 1 } as Subscription;
      mockSubscriptionRepository.findOne = jest.fn(() =>
        Promise.resolve(subscription),
      );

      const result = await service.findOne(1, 1);

      expect(result).toEqual(subscription);
      expect(mockSubscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
        relations: ['plan'],
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockSubscriptionRepository.findOne = jest.fn(() => Promise.resolve(null));

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementUsage', () => {
    it('should increment calls_used_this_cycle', async () => {
      const subscription = {
        id: 1,
        plan_id: 1,
        calls_used_this_cycle: 0,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription;
      const plan = { id: 1, monthly_call_limit: 2 } as SubscriptionPlan;

      mockSubscriptionRepository.findOne = jest.fn(() =>
        Promise.resolve(subscription),
      );
      mockPlanRepository.findOne = jest.fn(() => Promise.resolve(plan));
      mockSubscriptionRepository.save = jest.fn((s) => Promise.resolve(s));

      const result = await service.incrementUsage(1, 1);

      expect(result.calls_used_this_cycle).toBe(1);
      expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
        subscription,
      );
    });

    it('should throw BadRequestException if subscription not active', async () => {
      const subscription = {
        id: 1,
        status: SubscriptionStatus.CANCELLED,
      } as Subscription;
      mockSubscriptionRepository.findOne = jest.fn(() =>
        Promise.resolve(subscription),
      );

      await expect(service.incrementUsage(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('renew', () => {
    it('should renew subscription if auto_renew is true', async () => {
      const subscription = {
        id: 1,
        auto_renew: true,
        calls_used_this_cycle: 1,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription;
      mockSubscriptionRepository.findOne = jest.fn(() =>
        Promise.resolve(subscription),
      );
      mockSubscriptionRepository.save = jest.fn((s) => Promise.resolve(s));

      const result = await service.renew(1, 1);

      expect(result.calls_used_this_cycle).toBe(0);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should expire subscription if auto_renew is false', async () => {
      const subscription = {
        id: 1,
        auto_renew: false,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription;
      mockSubscriptionRepository.findOne = jest.fn(() =>
        Promise.resolve(subscription),
      );
      mockSubscriptionRepository.save = jest.fn((s) => Promise.resolve(s));

      const result = await service.renew(1, 1);

      expect(result.status).toBe(SubscriptionStatus.EXPIRED);
    });
  });

  describe('cancel', () => {
    it('should cancel subscription', async () => {
      const subscription = {
        id: 1,
        auto_renew: true,
        status: SubscriptionStatus.ACTIVE,
      } as Subscription;
      mockSubscriptionRepository.findOne.mockResolvedValue(subscription);
      mockSubscriptionRepository.save.mockImplementation((s) =>
        Promise.resolve(s),
      );

      const result = await service.cancel(1, 1);

      expect(result.auto_renew).toBe(false);
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });
  });
});
