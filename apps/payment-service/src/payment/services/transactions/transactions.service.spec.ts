import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { Repository } from 'typeorm';
import { Transaction } from 'src/payment/entities/transaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaginatedResponse } from '@huzaflix/common';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockPaymentRepository: Partial<Repository<PaymentRequest>> = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockPaymentRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all PaymentRequests if NOT paginated (admin)', async () => {
      const prs = [{ id: 1 }, { id: 2 }];
      (mockPaymentRepository.find as jest.Mock).mockResolvedValue(prs);

      const result = await service.findAll({}, 'administrator');

      expect(result).toEqual(prs);
      expect(mockPaymentRepository.find).toHaveBeenCalledWith();
    });

    it('should return user PaymentRequests if NOT paginated (non-admin)', async () => {
      const prs = [{ id: 1, userId: 5 }];
      (mockPaymentRepository.find as jest.Mock).mockResolvedValue(prs);

      const result = await service.findAll({}, 'user', 5);

      expect(result).toEqual(prs);
      expect(mockPaymentRepository.find).toHaveBeenCalledWith({
        where: { userId: 5 },
      });
    });

    it('should return paginated results (admin)', async () => {
      const prs = [{ id: 1 }, { id: 2 }];
      (mockPaymentRepository.findAndCount as jest.Mock).mockResolvedValue([
        prs,
        10,
      ]);

      const result = (await service.findAll(
        { page: 1, limit: 2 },
        'administrator',
      )) as {
        data: Transaction[];
        meta: PaginatedResponse;
      };

      expect(result.data).toEqual(prs);
      expect(result.meta).toBeInstanceOf(PaginatedResponse);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalItems).toBe(10);

      expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 2,
      });
    });

    it('should return paginated results (non-admin)', async () => {
      const prs = [{ id: 1, userId: 7 }];
      (mockPaymentRepository.findAndCount as jest.Mock).mockResolvedValue([
        prs,
        4,
      ]);

      const result = (await service.findAll(
        { page: 2, limit: 1 },
        'user',
        7,
      )) as {
        data: Transaction[];
        meta: PaginatedResponse;
      };

      expect(result.data).toEqual(prs);
      expect(result.meta.page).toBe(2);
      expect(result.meta.totalItems).toBe(4);

      expect(mockPaymentRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: 7 },
        skip: 1,
        take: 1,
      });
    });
  });

  describe('findOneById', () => {
    it('should return payment request if found (admin)', async () => {
      const pr = { id: 1 };
      (mockPaymentRepository.findOne as jest.Mock).mockResolvedValue(pr);

      const result = await service.findOneById(1, 'administrator');

      expect(result).toEqual(pr);
      expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return payment request if found (user)', async () => {
      const pr = { id: 1, userId: 5 };
      (mockPaymentRepository.findOne as jest.Mock).mockResolvedValue(pr);

      const result = await service.findOneById(1, 'user');

      expect(result).toEqual(pr);
      expect(mockPaymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      (mockPaymentRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and save a payment request', async () => {
      const dto = {
        remote_reference: '1234567890',
        amount: 100,
        payment_request_id: 1,
        userId: 1,
      };

      (mockPaymentRepository.create as jest.Mock).mockReturnValue(dto);
      (mockPaymentRepository.save as jest.Mock).mockResolvedValue(dto);

      const result = await service.create(dto);

      expect(mockPaymentRepository.create).toHaveBeenCalledWith(dto);
      expect(mockPaymentRepository.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(dto);
    });
  });
});
