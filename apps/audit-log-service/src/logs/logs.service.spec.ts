import { LogsService } from './logs.service';
import type { AuditActor, AuditEvent } from '@huzaflix/common';
import { AuditLog } from './audit-log.entity';
import type { Repository } from 'typeorm';

const actorUser = 'User' as unknown as AuditActor;
const eventLogin = 'LOGIN' as unknown as AuditEvent;
const eventApiKeyGen = 'API_KEY_GEN' as unknown as AuditEvent;

type RepoMock = Pick<
  Repository<AuditLog>,
  'create' | 'save' | 'createQueryBuilder'
>;

type QueryBuilderMock = {
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  getMany: jest.Mock;
};

function createQueryBuilderMock(): QueryBuilderMock {
  const qb: QueryBuilderMock = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([] as AuditLog[]),
  };
  return qb;
}

describe('LogsService', () => {
  it('creates and saves an immutable log', async () => {
    const repo: RepoMock = {
      create: jest.fn((v) => v as unknown as AuditLog),
      save: jest.fn((v) => Promise.resolve(v as AuditLog)),
      createQueryBuilder: jest.fn(),
    };

    const service = new LogsService(repo as unknown as Repository<AuditLog>);
    const created = await service.create({
      actor: actorUser,
      event: eventLogin,
      status: 200,
      ipAddress: '127.0.0.1',
      metadata: { userId: '123' },
      timestamp: new Date().toISOString(),
    });

    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
    expect(created.event).toBe(eventLogin);
  });

  it('applies filters in find()', async () => {
    const qb: QueryBuilderMock = createQueryBuilderMock();

    const repo: RepoMock = {
      create: jest.fn((v) => v as unknown as AuditLog),
      save: jest.fn((v) => Promise.resolve(v as AuditLog)),
      createQueryBuilder: jest.fn(() => qb as unknown as never),
    };

    const service = new LogsService(repo as unknown as Repository<AuditLog>);
    await service.find({
      eventType: eventApiKeyGen,
      userId: '42',
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-12-31T23:59:59.000Z'),
    });

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('l');
    expect(qb.andWhere).toHaveBeenCalled();
    expect(qb.orderBy).toHaveBeenCalledWith('l.timestamp', 'DESC');
  });
});
