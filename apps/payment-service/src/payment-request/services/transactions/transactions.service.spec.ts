import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { Repository } from 'typeorm';
import { Transaction } from 'src/payment-request/entities/transaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

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
