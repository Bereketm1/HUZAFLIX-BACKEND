import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { Billing } from 'src/billing/entities/billing.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('BillingService', () => {
  let service: BillingService;

  const mockBillingRepository: Partial<Repository<Billing>> = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getRepositoryToken(Billing),
          useValue: mockBillingRepository,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
