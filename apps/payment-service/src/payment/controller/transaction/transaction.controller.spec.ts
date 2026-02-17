import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { JwtAuthGuard, PaginatedResponse } from '@huzaflix/common';
import { NotFoundException } from '@nestjs/common';
import { TransactionsService } from 'src/payment/services/transactions/transactions.service';

describe('TransactionController', () => {
  let controller: TransactionController;

  const mockTransactionService = {
    findAll: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TransactionController>(TransactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll and return paginated results', async () => {
      const items = [
        { id: 1, amount: 50 },
        { id: 2, amount: 100 },
      ];

      const paginated = {
        data: items,
        meta: new PaginatedResponse(1, 2, 1),
      };

      mockTransactionService.findAll.mockResolvedValue(paginated);

      const user = { id: 10, role: { name: 'user' } };

      const result = await controller.findAll(
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        user,
      );

      expect(mockTransactionService.findAll).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 10,
          startDate: undefined,
          endDate: undefined,
          sortBy: undefined,
          order: undefined,
        },
        'user',
        10,
      );
      expect(result).toEqual(paginated);
    });

    it('should forward date and sort params to service', async () => {
      const paginated = { data: [], meta: new PaginatedResponse(1, 0, 0) };
      mockTransactionService.findAll.mockResolvedValue(paginated);

      const user = { id: 3, role: { name: 'user' } };

      const result = await controller.findAll(
        1,
        10,
        '2026-01-01',
        '2026-01-31',
        'amount',
        'asc',
        user,
      );

      expect(mockTransactionService.findAll).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 10,
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          sortBy: 'amount',
          order: 'asc',
        },
        'user',
        3,
      );

      expect(result).toEqual(paginated);
    });

    it('should work with admin role', async () => {
      const paginated = {
        data: [],
        meta: new PaginatedResponse(1, 0, 0),
      };

      mockTransactionService.findAll.mockResolvedValue(paginated);

      const admin = { id: 1, role: { name: 'administrator' } };

      const result = await controller.findAll(
        1,
        5,
        undefined,
        undefined,
        undefined,
        undefined,
        admin,
      );

      expect(mockTransactionService.findAll).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 5,
          startDate: undefined,
          endDate: undefined,
          sortBy: undefined,
          order: undefined,
        },
        'administrator',
        1,
      );
      expect(result).toEqual(paginated);
    });
  });

  describe('findOne', () => {
    it('should return a single payment request', async () => {
      const pr = { id: 1, amount: 200 };
      mockTransactionService.findOneById.mockResolvedValue(pr);

      const result = await controller.findOne('1', { role: { name: 'user' } });

      expect(mockTransactionService.findOneById).toHaveBeenCalledWith(
        1,
        'user',
      );
      expect(result).toEqual(pr);
    });

    it('should throw NotFoundException when not found', async () => {
      mockTransactionService.findOneById.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        controller.findOne('999', { role: { name: 'user' } }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
