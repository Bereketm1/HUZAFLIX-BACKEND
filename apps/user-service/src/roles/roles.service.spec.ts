import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from './roles.entity';
import { PaginatedResponse } from '@huzaflix/common';

describe('RolesService', () => {
  let service: RolesService;

  const mockRoleRepository = {
    create: jest.fn().mockReturnValue({ id: 1 }),
    save: jest.fn().mockResolvedValue({ id: 1 }),
    findOneById: jest.fn().mockResolvedValue({ id: 1 }),
    find: jest.fn().mockResolvedValue([{ id: 1 }]),
    findAndCount: jest.fn().mockResolvedValue([{ id: 1 }, 1]),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn().mockResolvedValue({ affected: 1 }),
    merge: jest.fn().mockResolvedValue({ id: 1 }),
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

  describe('findAll', () => {
    it('should return paginated roles', async () => {
      const mockRoles = [{ id: 1 }, { id: 2 }];
      mockRoleRepository.findAndCount.mockResolvedValue([mockRoles, 10]);

      const result = (await service.findAll({ page: 1, limit: 2 })) as {
        data: Role[];
        meta: PaginatedResponse;
      };

      expect(result.data).toEqual(mockRoles);
      expect(result.meta).toBeInstanceOf(PaginatedResponse);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.totalItems).toBe(10);
      expect(mockRoleRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 2,
      });
    });
  });

  describe('findOneById', () => {
    it('should return a role by id', async () => {
      const mockRole = { id: 1 };
      mockRoleRepository.findOneById.mockResolvedValue(mockRole);

      const result = await service.findOneById(1);

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.findOneById).toHaveBeenCalledWith(1);
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const mockRole = { id: 1 };
      mockRoleRepository.create.mockResolvedValue(mockRole);

      const result = await service.create({
        name: 'admin',
        description: 'Administrator',
      });

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.create).toHaveBeenCalledWith({
        name: 'admin',
        description: 'Administrator',
      });
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const mockRole = { id: 1 };
      mockRoleRepository.findOneById.mockResolvedValue(mockRole);

      const result = await service.update(1, {
        name: 'admin',
        description: 'Administrator',
      });

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.findOneById).toHaveBeenCalledWith(1);
      expect(mockRoleRepository.save).toHaveBeenCalledWith(mockRole);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      const mockRole = { id: 1 };
      mockRoleRepository.findOneById.mockResolvedValue(mockRole);

      const result = await service.delete(1);

      expect(result).toEqual(mockRole);
      expect(mockRoleRepository.findOneById).toHaveBeenCalledWith(1);
      expect(mockRoleRepository.remove).toHaveBeenCalledWith(mockRole);
    });
  });
});
