import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { ActivityLogService } from 'src/api/activity-log/activity-log.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaginatedResponse } from '@huzaflix/common';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/subscription/entities/subscriptions.entity';
import { SubscriptionPlan } from 'src/subscription/entities/plans.entity';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  const mockSubscriptionRepository: Partial<Repository<Subscription>> = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockPlanRepository: Partial<Repository<SubscriptionPlan>> = {
    findOne: jest.fn(),
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
          provide: ActivityLogService,
          useValue: { createAudit: jest.fn() },
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
      const plan = { id: 1, monthly_call_limit: 10 } as SubscriptionPlan;
      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue(plan);

      const subscription = {
        user_id: 1,
        plan_id: plan.id,
        auto_renew: true,
        calls_used_this_cycle: 0,
      } as Subscription;

      (mockSubscriptionRepository.create as jest.Mock).mockReturnValue(
        subscription,
      );
      (mockSubscriptionRepository.save as jest.Mock).mockResolvedValue(
        subscription,
      );

      const result = await service.create({ plan_id: 1 }, 1);

      expect(mockPlanRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockSubscriptionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          plan_id: 1,
          status: SubscriptionStatus.ACTIVE,
        }),
      );
      expect(result).toEqual(subscription);
      const audit = testingModule.get<ActivityLogService>(ActivityLogService) as any;
      expect(audit.createAudit).toHaveBeenCalled();
    });

    it('should throw NotFoundException if plan does not exist', async () => {
      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.create({ plan_id: 999 }, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all subscriptions for admin when not paginated', async () => {
      const subscriptions = [{ id: 1 }, { id: 2 }];
      (mockSubscriptionRepository.find as jest.Mock).mockResolvedValue(
        subscriptions,
      );

      const result = await service.findAll({}, 1, 'administrator');

      expect(result).toEqual(subscriptions);
      expect(mockSubscriptionRepository.find).toHaveBeenCalledWith({
        relations: ['plan'],
      });
    });

    it('should return subscriptions for user when not paginated', async () => {
      const subscriptions = [{ id: 1 }];
      (mockSubscriptionRepository.find as jest.Mock).mockResolvedValue(
        subscriptions,
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
      (mockSubscriptionRepository.findAndCount as jest.Mock).mockResolvedValue([
        subscriptions,
        3,
      ]);

      const result = (await service.findAll(
        { page: 1, limit: 1 },
        1,
        'user',
      )) as { data: Subscription[]; meta: PaginatedResponse };

      expect(mockSubscriptionRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 1,
        where: { user_id: 1 },
        relations: ['plan'],
      });
      expect(result.data).toEqual(subscriptions);
      expect(result.meta.totalItems).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a subscription if found', async () => {
      const subscription = { id: 1 } as Subscription;
      (mockSubscriptionRepository.findOne as jest.Mock).mockResolvedValue(
        subscription,
      );

      const result = await service.findOne(1, 1);

      expect(result).toEqual(subscription);
      expect(mockSubscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, user_id: 1 },
        relations: ['plan'],
      });
    });

    it('should throw NotFoundException if not found', async () => {
      (mockSubscriptionRepository.findOne as jest.Mock).mockResolvedValue(null);

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

      (mockSubscriptionRepository.findOne as jest.Mock).mockResolvedValue(
        subscription,
      );
      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue(plan);
      (mockSubscriptionRepository.save as jest.Mock).mockImplementation((s) =>
        Promise.resolve(s),
      );

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
      (mockSubscriptionRepository.findOne as jest.Mock).mockResolvedValue(
        subscription,
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
      (mockSubscriptionRepository.findOne as jest.Mock).mockResolvedValue(
        subscription,
      );
      (mockSubscriptionRepository.save as jest.Mock).mockImplementation((s) =>
        Promise.resolve(s),
      );

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
      (mockSubscriptionRepository.findOne as jest.Mock).mockResolvedValue(
        subscription,
      );
      (mockSubscriptionRepository.save as jest.Mock).mockImplementation((s) =>
        Promise.resolve(s),
      );

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
      (mockSubscriptionRepository.findOne as jest.Mock).mockResolvedValue(
        subscription,
      );
      (mockSubscriptionRepository.save as jest.Mock).mockImplementation((s) =>
        Promise.resolve(s),
      );

      const result = await service.cancel(1, 1);

      expect(result.auto_renew).toBe(false);
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      const audit = testingModule.get<ActivityLogService>(ActivityLogService) as any;
      expect(audit.createAudit).toHaveBeenCalled();
    });
  });
});
