import { Test, TestingModule } from '@nestjs/testing';
import {
  JwtAuthGuard,
  JwtAuthGuardWithPublic,
  RolesGuard,
  PaginatedResponse,
} from '@huzaflix/common';
import { NotFoundException } from '@nestjs/common';
import { PaymentRequestController } from './payment-request.controller';
import { PaymentRequestService } from 'src/payment/services/payment-request/payment-request.service';
import { CreatePaymentRequestDto } from 'src/payment/dto/payment-request/create-payment-request.dto';
import { PaymentStatus } from 'src/payment/entities/payment-request.entity';

describe('PaymentRequestController', () => {
  let controller: PaymentRequestController;

  const mockPaymentRequestService = {
    findAll: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentRequestController],
      providers: [
        {
          provide: PaymentRequestService,
          useValue: mockPaymentRequestService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuardWithPublic)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PaymentRequestController>(PaymentRequestController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll and return paginated results', async () => {
      const items = [
        { id: 1, amount: 50, status: PaymentStatus.PENDING },
        { id: 2, amount: 100, status: PaymentStatus.SUCCESS },
      ];

      const paginated = {
        data: items,
        meta: new PaginatedResponse(1, 2, 1),
      };

      mockPaymentRequestService.findAll.mockResolvedValue(paginated);

      const user = { id: 10, role: { name: 'user' } };

      const result = await controller.findAll(1, 10, user);

      expect(mockPaymentRequestService.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        'user',
        10,
      );
      expect(result).toEqual(paginated);
    });

    it('should work with admin role', async () => {
      const paginated = {
        data: [],
        meta: new PaginatedResponse(1, 0, 0),
      };

      mockPaymentRequestService.findAll.mockResolvedValue(paginated);

      const admin = { id: 1, role: { name: 'administrator' } };

      const result = await controller.findAll(1, 5, admin);

      expect(mockPaymentRequestService.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 5 },
        'administrator',
        1,
      );
      expect(result).toEqual(paginated);
    });
  });

  describe('findOne', () => {
    it('should return a single payment request', async () => {
      const pr = { id: 1, amount: 200 };
      mockPaymentRequestService.findOneById.mockResolvedValue(pr);

      const result = await controller.findOne('1', { role: { name: 'user' } });

      expect(mockPaymentRequestService.findOneById).toHaveBeenCalledWith(
        1,
        'user',
      );
      expect(result).toEqual(pr);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPaymentRequestService.findOneById.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        controller.findOne('999', { role: { name: 'user' } }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should call service.create and return created payment request', async () => {
      const dto: CreatePaymentRequestDto = {
        amount: 120,
        method: 'mtn',
      };

      const created = { id: 1, ...dto, userId: 5 };
      mockPaymentRequestService.create.mockResolvedValue(created);

      const result = await controller.create(dto, { id: '5' });

      expect(mockPaymentRequestService.create).toHaveBeenCalledWith({
        ...dto,
        userId: 5,
      });

      expect(result).toEqual(created);
    });
  });
});
