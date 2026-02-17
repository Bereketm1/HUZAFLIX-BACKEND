import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConsumerApiKeyService } from './consumer-api-key.service';
import { ApiKey, KeyStatus } from '../../entities/api-key.entity';
import { Api } from '../../entities/api.entity';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/subscription/entities/subscriptions.entity';
import { CreateConsumerApiKeyDto } from '../../dto/consumer-api-key/create-consumer-api-key.dto';

describe('ConsumerApiKeyService', () => {
  let service: ConsumerApiKeyService;

  const apiKeyRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const apiRepo = {
    findOneBy: jest.fn(),
  };

  const subscriptionRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumerApiKeyService,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: apiKeyRepo,
        },
        {
          provide: getRepositoryToken(Api),
          useValue: apiRepo,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepo,
        },
      ],
    }).compile();

    service = module.get<ConsumerApiKeyService>(ConsumerApiKeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('createForUser should fail when api is missing', async () => {
    apiRepo.findOneBy.mockResolvedValue(null);

    const dto = { api_id: 999 } as CreateConsumerApiKeyDto;
    await expect(service.createForUser('10', dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('createForUser should fail when user has no active subscription', async () => {
    apiRepo.findOneBy.mockResolvedValue({ id: 1 });
    subscriptionRepo.findOne.mockResolvedValue(null);

    const dto = { api_id: 1 } as CreateConsumerApiKeyDto;
    await expect(service.createForUser('10', dto)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('createForUser should create a key with generated name and calculated expiry', async () => {
    apiRepo.findOneBy.mockResolvedValue({ id: 1 });
    subscriptionRepo.findOne.mockResolvedValue({
      id: 5,
      status: SubscriptionStatus.ACTIVE,
    });
    apiKeyRepo.create.mockImplementation(
      (payload: Record<string, unknown>) => payload,
    );
    apiKeyRepo.save.mockImplementation((payload) =>
      Promise.resolve({ ...payload, id: '11' }),
    );

    const dto = { api_id: 1, expires_in_days: 30 } as CreateConsumerApiKeyDto;
    const res = await service.createForUser('10', dto);

    expect(res.key).toBeDefined();
    expect(res.name).toMatch(/^key-/);
    expect(res.expires_at).toBeDefined();
    expect(apiKeyRepo.create).toHaveBeenCalled();
  });

  it('activateForUser should set status active', async () => {
    apiKeyRepo.findOne.mockResolvedValue({
      id: '1',
      user_id: '10',
      status: KeyStatus.INACTIVE,
      revoked_at: null,
    });
    apiKeyRepo.save.mockImplementation((payload) => Promise.resolve(payload));

    const res = await service.activateForUser('10', 1);
    expect(res.status).toBe(KeyStatus.ACTIVE);
  });

  it('deactivateForUser should set status inactive', async () => {
    apiKeyRepo.findOne.mockResolvedValue({
      id: '1',
      user_id: '10',
      status: KeyStatus.ACTIVE,
      revoked_at: null,
    });
    apiKeyRepo.save.mockImplementation((payload) => Promise.resolve(payload));

    const res = await service.deactivateForUser('10', 1);
    expect(res.status).toBe(KeyStatus.INACTIVE);
  });

  it('updateExpiryForUser should clear expiry when no payload is provided', async () => {
    apiKeyRepo.findOne.mockResolvedValue({
      id: '1',
      user_id: '10',
      status: KeyStatus.ACTIVE,
      revoked_at: null,
      expires_at: new Date(),
    });
    apiKeyRepo.save.mockImplementation((payload) => Promise.resolve(payload));

    const res = await service.updateExpiryForUser('10', 1, {});
    expect(res.expires_at).toBeNull();
  });

  it('revokeForUser should set revoked_at and status inactive', async () => {
    apiKeyRepo.findOne.mockResolvedValue({
      id: '1',
      user_id: '10',
      status: KeyStatus.ACTIVE,
      revoked_at: null,
    });
    apiKeyRepo.save.mockImplementation((payload) => Promise.resolve(payload));

    const res = await service.revokeForUser('10', 1);
    expect(res.status).toBe(KeyStatus.INACTIVE);
    expect(res.revoked_at).toBeDefined();
  });
});
