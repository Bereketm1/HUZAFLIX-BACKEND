import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumerApiKeyService } from './consumer-api-key.service';
import { ApiKey } from '../../entities/api-key.entity';

describe('ConsumerApiKeyService', () => {
  let service: ConsumerApiKeyService;
  let repo: Partial<Record<keyof Repository<ApiKey>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsumerApiKeyService,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<ConsumerApiKeyService>(ConsumerApiKeyService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  it('findAllForUser should return safe objects without key_hash', async () => {
    const rows = [{ id: 1, key_hash: Buffer.from('x'), name: 'a' } as any];
    (repo.find as jest.Mock).mockResolvedValue(rows);

    const res = await service.findAllForUser('42');
    expect(repo.find).toHaveBeenCalledWith({ where: { user_id: '42' } });
    expect(res[0].key_hash).toBeUndefined();
    expect(res[0].name).toBe('a');
  });

  it('createForUser should save new key and return cleartext key and record', async () => {
    (repo.create as jest.Mock).mockImplementation((x) => x);
    (repo.save as jest.Mock).mockImplementation(async (x) => ({ id: 10, ...x }));

    const dto = { name: 'n' } as any;
    const out = await service.createForUser('100', dto);

    expect(out.key).toBeDefined();
    expect(out.id).toBe(10);
    expect(repo.save).toHaveBeenCalled();
  });

  it('updateForUser should update existing key for matching user', async () => {
    const found = { id: '2', user_id: '5', name: 'old', rate_limit_per_minute: 1 } as any;
    (repo.findOne as jest.Mock).mockResolvedValue(found);
    (repo.save as jest.Mock).mockImplementation(async (x) => x);

    const dto = { name: 'new' } as any;
    const res = await service.updateForUser('5', 2, dto);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: '2', user_id: '5' } });
    expect(res.name).toBe('new');
  });

  it('revokeForUser should set revoked_at when found', async () => {
    const found = { id: '3', user_id: '9' } as any;
    (repo.findOne as jest.Mock).mockResolvedValue(found);
    (repo.save as jest.Mock).mockImplementation(async (x) => x);

    const res = await service.revokeForUser('9', 3);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: '3', user_id: '9' } });
    expect(res.revoked_at).toBeDefined();
  });
});
