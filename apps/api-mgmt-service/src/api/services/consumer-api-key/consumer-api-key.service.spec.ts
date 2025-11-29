import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
// repository type not required in tests; keep local mocks instead of using Repository
import { ConsumerApiKeyService } from './consumer-api-key.service';
import { ActivityLogService } from '../../activity-log/activity-log.service';
import { CreateConsumerApiKeyDto } from '../../dto/consumer-api-key/create-consumer-api-key.dto';
import { UpdateConsumerApiKeyDto } from '../../dto/consumer-api-key/update-consumer-api-key.dto';
import { ApiKey } from '../../entities/api-key.entity';

describe('ConsumerApiKeyService', () => {
  let service: ConsumerApiKeyService;
  let findMock: jest.Mock;
  let createMock: jest.Mock;
  let saveMock: jest.Mock;
  let findOneMock: jest.Mock;
  let repo: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let auditMock: { createAudit: jest.Mock };

  let testingModule: TestingModule;

  beforeEach(async () => {
    findMock = jest.fn();
    createMock = jest.fn();
    saveMock = jest.fn();
    findOneMock = jest.fn();

    repo = {
      find: findMock,
      create: createMock,
      save: saveMock,
      findOne: findOneMock,
    };

    auditMock = { createAudit: jest.fn() };
    testingModule = await Test.createTestingModule({
      providers: [
        ConsumerApiKeyService,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: repo,
        },
        {
          provide: ActivityLogService,
          useValue: auditMock,
        },
      ],
    }).compile();

    service = testingModule.get<ConsumerApiKeyService>(ConsumerApiKeyService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  it('findAllForUser should return safe objects without key_hash', async () => {
    const rows: Partial<ApiKey>[] = [
      { id: '1', key_hash: Buffer.from('x'), name: 'a' },
    ];
    // assign a new function instead of calling mockResolvedValue to avoid unbound-method lint issues
    findMock = jest.fn(() => Promise.resolve(rows));
    repo.find = findMock;

    const res = await service.findAllForUser('42');
    expect(findMock).toHaveBeenCalledWith({ where: { user_id: '42' } });
    expect(res[0].key_hash).toBeUndefined();
    expect(res[0].name).toBe('a');
  });

  it('createForUser should save new key and return cleartext key and record', async () => {
    // assign implementations directly to the mock function variables
    createMock = jest.fn((x) => ({ id: '0', ...(x as object) }) as ApiKey);
    saveMock = jest.fn((x) => Promise.resolve({ id: 10, ...x }));
    repo.create = createMock;
    repo.save = saveMock;

    const dto: Partial<CreateConsumerApiKeyDto> = { name: 'n' };
    const out = await service.createForUser('100', dto);

    expect(out.key).toBeDefined();
    expect(out.id).toBe(10);
    expect(saveMock).toHaveBeenCalled();
    expect(auditMock.createAudit).toHaveBeenCalled();
  });

  it('updateForUser should update existing key for matching user', async () => {
    const found: Partial<ApiKey> = {
      id: '2',
      user_id: '5',
      name: 'old',
      rate_limit_per_minute: 1,
    };
    findOneMock = jest.fn(() => Promise.resolve(found));
    saveMock = jest.fn((x) => Promise.resolve(x));
    repo.findOne = findOneMock;
    repo.save = saveMock;

    const dto: Partial<UpdateConsumerApiKeyDto> = { name: 'new' };
    const res = await service.updateForUser('5', 2, dto);

    expect(findOneMock).toHaveBeenCalledWith({
      where: { id: '2', user_id: '5' },
    });
    expect(res.name).toBe('new');
  });

  it('revokeForUser should set revoked_at when found', async () => {
    const found: Partial<ApiKey> = { id: '3', user_id: '9' };
    findOneMock = jest.fn(() => Promise.resolve(found));
    saveMock = jest.fn((x) => Promise.resolve(x));
    repo.findOne = findOneMock;
    repo.save = saveMock;

    const res = await service.revokeForUser('9', 3);
    expect(findOneMock).toHaveBeenCalledWith({
      where: { id: '3', user_id: '9' },
    });
    expect(res.revoked_at).toBeDefined();
    expect(auditMock.createAudit).toHaveBeenCalled();
  });
});
