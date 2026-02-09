import { Test, TestingModule } from '@nestjs/testing';
import { ApiUsageService } from './api-usage.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Api, ApiStatus } from '../../entities/api.entity';
import { ApiKey } from '../../entities/api-key.entity';
import { Subscription, SubscriptionStatus } from '../../../subscription/entities/subscriptions.entity';
import { SubscriptionPlan } from '../../../subscription/entities/plans.entity';

describe('ApiUsageService', () => {
  let service: ApiUsageService;

  const mockApiRepository = {
    find: jest.fn(),
  };
  const mockApiKeyRepository = {
    findOne: jest.fn(),
  };
  const mockSubscriptionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const mockPlanRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiUsageService,
        { provide: getRepositoryToken(Api), useValue: mockApiRepository },
        { provide: getRepositoryToken(ApiKey), useValue: mockApiKeyRepository },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepository },
        { provide: getRepositoryToken(SubscriptionPlan), useValue: mockPlanRepository },
      ],
    }).compile();

    service = module.get<ApiUsageService>(ApiUsageService);
  });

  describe('validateRequest', () => {
    it('should allow request if path does not match any managed API', async () => {
      mockApiRepository.find.mockResolvedValue([]);
      const result = await service.validateRequest('key', '/some/path');
      expect(result.allowed).toBe(true);
    });

    it('should fail if apiKey is missing for managed API', async () => {
      mockApiRepository.find.mockResolvedValue([{ base_path: '/managed' } as Api]);
      const result = await service.validateRequest(undefined, '/managed/resource');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Missing API Key');
    });

    it('should fail if apiKey is invalid', async () => {
      mockApiRepository.find.mockResolvedValue([{ base_path: '/managed', id: 1 } as Api]);
      mockApiKeyRepository.findOne.mockResolvedValue(null);
      
      const result = await service.validateRequest('invalid-key', '/managed/resource');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Invalid API Key');
    });

    it('should fail if subscription is missing', async () => {
      mockApiRepository.find.mockResolvedValue([{ base_path: '/managed', id: 1 } as Api]);
      mockApiKeyRepository.findOne.mockResolvedValue({ 
          status: 'active', 
          user_id: 1,
          api: { id: 1 } // Matches
      });
      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.validateRequest('valid-key', '/managed/resource');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No active subscription');
    });

    it('should fail if quota exceeded', async () => {
      mockApiRepository.find.mockResolvedValue([{ base_path: '/managed', id: 1 } as Api]);
      mockApiKeyRepository.findOne.mockResolvedValue({ status: 'active', user_id: 1, api: { id: 1 } });
      mockSubscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
        current_cycle_end: new Date(Date.now() + 10000),
        calls_used_this_cycle: 10,
        plan: { monthly_call_limit: 10 },
      });

      const result = await service.validateRequest('valid-key', '/managed/resource');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('limit reached');
    });

    it('should allow and increment usage if valid', async () => {
      mockApiRepository.find.mockResolvedValue([{ base_path: '/managed', id: 1 } as Api]);
      mockApiKeyRepository.findOne.mockResolvedValue({ status: 'active', user_id: 1, api: { id: 1 } });
      const subscription = {
        status: SubscriptionStatus.ACTIVE,
        current_cycle_end: new Date(Date.now() + 10000),
        calls_used_this_cycle: 0,
        plan: { monthly_call_limit: 10 },
      };
      mockSubscriptionRepository.findOne.mockResolvedValue(subscription);
      mockSubscriptionRepository.save.mockResolvedValue(subscription);

      const result = await service.validateRequest('valid-key', '/managed/resource');
      expect(result.allowed).toBe(true);
      expect(subscription.calls_used_this_cycle).toBe(1);
      expect(mockSubscriptionRepository.save).toHaveBeenCalled();
    });
  });
});
