import { Test, TestingModule } from '@nestjs/testing';
import { PlanService } from './plan.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan, PlanStatus } from '../../entities/plans.entity';
import { ForbiddenException } from '@nestjs/common';
import { PaginatedResponse } from '@huzaflix/common';

describe('PlanService', () => {
  let service: PlanService;

  const mockPlanRepository: Partial<Repository<SubscriptionPlan>> = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanService,
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockPlanRepository,
        },
      ],
    }).compile();

    service = module.get<PlanService>(PlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all plans for admin when not paginated', async () => {
      const plans = [{ id: 1 }, { id: 2 }];
      (mockPlanRepository.find as jest.Mock).mockResolvedValue(plans);

      const result = await service.findAll({}, 'administrator');

      expect(result).toEqual(plans);
      expect(mockPlanRepository.find).toHaveBeenCalledWith();
    });

    it('should return only ACTIVE plans for non-admin when not paginated', async () => {
      const plans = [{ id: 1, status: PlanStatus.ACTIVE }];
      (mockPlanRepository.find as jest.Mock).mockResolvedValue(plans);

      const result = await service.findAll({}, 'user');

      expect(result).toEqual(plans);
      expect(mockPlanRepository.find).toHaveBeenCalledWith({
        where: { status: PlanStatus.ACTIVE },
      });
    });

    it('should return paginated plans for admin', async () => {
      const plans = [{ id: 1 }, { id: 2 }];

      (mockPlanRepository.findAndCount as jest.Mock).mockResolvedValue([
        plans,
        10,
      ]);

      const result = (await service.findAll(
        { page: 1, limit: 2 },
        'administrator',
      )) as { data: SubscriptionPlan[]; meta: PaginatedResponse };

      expect(result.data).toEqual(plans);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalItems).toBe(10);
      expect(result.meta.totalPages).toBe(5);

      expect(mockPlanRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 2,
        where: {},
      });
    });

    it('should return paginated ACTIVE plans for non-admin', async () => {
      const plans = [{ id: 1 }];

      (mockPlanRepository.findAndCount as jest.Mock).mockResolvedValue([
        plans,
        3,
      ]);

      const result = (await service.findAll({ page: 1, limit: 1 }, 'user')) as {
        data: SubscriptionPlan[];
        meta: PaginatedResponse;
      };

      expect(mockPlanRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 1,
        where: { status: PlanStatus.ACTIVE },
      });

      expect(result.data).toEqual(plans);
    });
  });

  describe('findOneById', () => {
    it('should return a plan if found', async () => {
      const plan = { id: 1 };
      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue(plan);

      const result = await service.findOneById(1);

      expect(result).toEqual(plan);
      expect(mockPlanRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, status: PlanStatus.ACTIVE },
      });
    });

    it('should return null if not found', async () => {
      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findOneById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a plan', async () => {
      const plan = {
        name: 'Plan A',
        monthly_price: 10,
        monthly_call_limit: 100,
        avg_price_per_call: 0.1,
        status: PlanStatus.ACTIVE,
      };

      (mockPlanRepository.save as jest.Mock).mockResolvedValue({
        id: 1,
        ...plan,
      });

      const result = await service.create(plan as SubscriptionPlan);

      expect(mockPlanRepository.save).toHaveBeenCalledWith(plan);
      expect(result).toEqual({ id: 1, ...plan });
    });
  });

  describe('update', () => {
    it('should update an inactive plan', async () => {
      const existing = {
        id: 1,
        name: 'Old',
        status: PlanStatus.INACTIVE,
      };

      const updateData = { name: 'New' } as SubscriptionPlan;

      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue(existing);
      (mockPlanRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const result = await service.update(1, updateData);

      expect(result.name).toBe('New');
      expect(mockPlanRepository.save).toHaveBeenCalledWith({
        ...existing,
        ...updateData,
      });
    });

    it('should throw if plan not found', async () => {
      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {} as SubscriptionPlan)).rejects.toThrow(
        `Plan with id 999 not found`,
      );
    });

    it('should throw ForbiddenException if plan is ACTIVE', async () => {
      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        status: PlanStatus.ACTIVE,
      });

      await expect(service.update(1, {} as SubscriptionPlan)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should delete an inactive plan', async () => {
      const existing = {
        id: 1,
        status: PlanStatus.INACTIVE,
      };

      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue(existing);
      (mockPlanRepository.remove as jest.Mock).mockResolvedValue(undefined);

      await service.delete(1);

      expect(mockPlanRepository.remove).toHaveBeenCalledWith(existing);
    });

    it('should throw if plan not found', async () => {
      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(
        `Plan with id 999 not found`,
      );
    });

    it('should throw ForbiddenException if plan is ACTIVE', async () => {
      (mockPlanRepository.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        status: PlanStatus.ACTIVE,
      });

      await expect(service.delete(1)).rejects.toThrow(ForbiddenException);
    });
  });
});
