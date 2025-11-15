import { Test, TestingModule } from '@nestjs/testing';
import { PlanController } from './plan.controller';
import { JwtAuthGuard, RolesGuard, PaginatedResponse } from '@huzaflix/common';
import { NotFoundException } from '@nestjs/common';
import { PlanService } from 'src/subscription/services/plan/plan.service';
import { PlanStatus } from 'src/subscription/entities/plans.entity';
import { CreateSubscriptionPlanDto } from 'src/subscription/dto/plan/plan-create.dto';
import { UpdateSubscriptionPlanDto } from 'src/subscription/dto/plan/plan-update.dto';

describe('PlanController', () => {
  let controller: PlanController;

  const mockPlanService = {
    findAll: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanController],
      providers: [
        {
          provide: PlanService,
          useValue: mockPlanService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PlanController>(PlanController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call planService.findAll and return paginated plans', async () => {
      const plans = [
        { id: 1, name: 'Basic Plan', status: PlanStatus.ACTIVE },
        { id: 2, name: 'Pro Plan', status: PlanStatus.INACTIVE },
      ];

      const paginated = {
        data: plans,
        meta: new PaginatedResponse(1, 2, 1),
      };

      mockPlanService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll(1, 10);

      expect(mockPlanService.findAll).toHaveBeenCalled();
      expect(result).toEqual(paginated);
    });
  });

  describe('findOne', () => {
    it('should return the plan by ID', async () => {
      const plan = { id: 1, name: 'Basic Plan' };
      mockPlanService.findOneById.mockResolvedValue(plan);

      const result = await controller.findOne('1');

      expect(mockPlanService.findOneById).toHaveBeenCalledWith(1);
      expect(result).toEqual(plan);
    });

    it('should throw NotFoundException if plan not found', async () => {
      mockPlanService.findOneById.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return the plan', async () => {
      const dto: CreateSubscriptionPlanDto = {
        name: 'Starter Plan',
        description: 'A basic plan',
        monthly_price: 10,
        monthly_call_limit: 1000,
        avg_price_per_call: 0.01,
      };

      const created = { id: 1, ...dto };
      mockPlanService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(mockPlanService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('should update and return the plan', async () => {
      const dto: UpdateSubscriptionPlanDto = {
        name: 'Updated Plan',
      };

      const updated = { id: 1, name: 'Updated Plan' };
      mockPlanService.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto);

      expect(mockPlanService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if plan not found', async () => {
      mockPlanService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update(999, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should call planService.delete', async () => {
      mockPlanService.delete.mockResolvedValue(undefined);

      await controller.delete(1);

      expect(mockPlanService.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if deletion target is not found', async () => {
      mockPlanService.delete.mockRejectedValue(new NotFoundException());

      await expect(controller.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
});
