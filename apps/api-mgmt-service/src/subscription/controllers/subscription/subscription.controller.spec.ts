import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from 'src/subscription/services/subscription/subscription.service';
import {
  JwtAuthGuard,
  RolesGuard,
  UserGuard,
  PaginatedResponse,
} from '@huzaflix/common';
import { NotFoundException } from '@nestjs/common';
import { CreateSubscriptionDto } from 'src/subscription/dto/subscription/subscription-create.dto';
import { SubscriptionStatus } from 'src/subscription/entities/subscriptions.entity';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;

  const mockSubscriptionService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    incrementUsage: jest.fn(),
    renew: jest.fn(),
    cancel: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(UserGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call subscriptionService.findAll and return paginated subscriptions', async () => {
      const subscriptions = [
        { id: 1, status: SubscriptionStatus.ACTIVE },
        { id: 2, status: SubscriptionStatus.CANCELLED },
      ];
      const paginated = {
        data: subscriptions,
        meta: new PaginatedResponse(1, 2, 1),
      };

      mockSubscriptionService.findAll.mockResolvedValue(paginated);

      const user = { id: 1, role: { name: 'administrator' } };
      const result = await controller.findAll(1, 10, user);

      expect(mockSubscriptionService.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        user.id,
        user.role.name,
      );
      expect(result).toEqual(paginated);
    });
  });

  describe('findOne', () => {
    it('should return the subscription by ID', async () => {
      const subscription = { id: 1, status: SubscriptionStatus.ACTIVE };
      mockSubscriptionService.findOne.mockResolvedValue(subscription);

      const user = { id: 1, role: { name: 'user' } };
      const result = await controller.findOne('1', user);

      expect(mockSubscriptionService.findOne).toHaveBeenCalledWith(
        1,
        user.id,
        user.role.name,
      );
      expect(result).toEqual(subscription);
    });

    it('should throw NotFoundException if subscription not found', async () => {
      mockSubscriptionService.findOne.mockRejectedValue(
        new NotFoundException(),
      );

      const user = { id: 1, role: { name: 'user' } };
      await expect(controller.findOne('999', user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return the subscription', async () => {
      const dto: CreateSubscriptionDto = { plan_id: 1 };
      const created = { id: 1, ...dto, status: SubscriptionStatus.ACTIVE };

      mockSubscriptionService.create.mockResolvedValue(created);

      const user = { id: 1 };
      const result = await controller.create(dto, user);

      expect(mockSubscriptionService.create).toHaveBeenCalledWith(dto, user.id);
      expect(result).toEqual(created);
    });
  });

  describe('incrementUsage', () => {
    it('should increment subscription usage', async () => {
      const updated = { id: 1, calls_used_this_cycle: 1 };
      mockSubscriptionService.incrementUsage.mockResolvedValue(updated);

      const user = { id: 1 };
      const result = await controller.incrementUsage('1', user);

      expect(mockSubscriptionService.incrementUsage).toHaveBeenCalledWith(
        1,
        user.id,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('renew', () => {
    it('should renew the subscription', async () => {
      const renewed = { id: 1, status: SubscriptionStatus.ACTIVE };
      mockSubscriptionService.renew.mockResolvedValue(renewed);

      const user = { id: 1 };
      const result = await controller.renew('1', user);

      expect(mockSubscriptionService.renew).toHaveBeenCalledWith(1, user.id);
      expect(result).toEqual(renewed);
    });
  });

  describe('cancel', () => {
    it('should cancel the subscription', async () => {
      const cancelled = { id: 1, status: SubscriptionStatus.CANCELLED };
      mockSubscriptionService.cancel.mockResolvedValue(cancelled);

      const user = { id: 1 };
      const result = await controller.cancel('1', user);

      expect(mockSubscriptionService.cancel).toHaveBeenCalledWith(1, user.id);
      expect(result).toEqual(cancelled);
    });
  });
});
