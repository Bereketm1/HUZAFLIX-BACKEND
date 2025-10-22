import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from './roles.entity';

describe('RolesService', () => {
  let service: RolesService;

  const mockRoleRepository = {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    save: jest.fn().mockResolvedValue({ id: 1 }),
    findOne: jest.fn().mockResolvedValue({ id: 1 }),
    find: jest.fn().mockResolvedValue([{ id: 1 }]),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
