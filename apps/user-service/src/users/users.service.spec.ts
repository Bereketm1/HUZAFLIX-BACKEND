import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users.entity';
import { RolesService } from 'src/roles/roles.service';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedResponse } from '@huzaflix/common';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-pass'),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository: Partial<Repository<User>> = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRolesService: Partial<RolesService> = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];
      (mockUserRepository.findAndCount as jest.Mock).mockResolvedValue([
        mockUsers,
        10,
      ]);

      const result = await service.findAll({ page: 1, limit: 2 });

      expect(result.data).toEqual(mockUsers);
      expect(result.meta).toBeInstanceOf(PaginatedResponse);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.totalItems).toBe(10);
      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 2,
      });
    });
  });

  describe('findOneById', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: 1 };
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await service.findOneById(1);
      expect(res).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['role'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = { email: 'a@b.com' };
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await service.findOneByEmail('a@b.com');
      expect(res).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
        relations: ['role'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOneByEmail('notfound@b.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should hash password, assign role, and save user', async () => {
      const dto: CreateUserDto = {
        email: 'a@b.com',
        password: 'plainpass',
        role_id: 1,
      };
      const role = { id: 1, name: 'user' };

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);
      (mockRolesService.findOneById as jest.Mock).mockResolvedValue(role);
      (mockUserRepository.create as jest.Mock).mockReturnValue({ ...dto });
      (mockUserRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve({ id: 1, ...u, role }),
      );

      const res = await service.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(res).toHaveProperty('id');
      expect(res.role).toEqual(role);
    });

    it('should throw if email already exists', async () => {
      const dto: CreateUserDto = {
        email: 'a@b.com',
        password: 'pass',
        role_id: 1,
      };
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(service.create(dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should allow creation without password (OAuth)', async () => {
      const dto = { email: 'a@b.com', role_id: 1 };
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);
      (mockRolesService.findOneById as jest.Mock).mockResolvedValue({ id: 1 });
      (mockUserRepository.create as jest.Mock).mockReturnValue({ ...dto });
      (mockUserRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve({ id: 1, ...u }),
      );

      const res = await service.create(dto);
      expect(res).toHaveProperty('id');
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user data and role if role_id changed', async () => {
      const existingUser = { id: 1, role: { id: 1 }, email: 'old@test.com' };
      const dto: UpdateUserDto = { email: 'new@test.com', role_id: 2 };

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(existingUser);
      (mockRolesService.findOneById as jest.Mock).mockResolvedValue({ id: 2 });
      (mockUserRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const res = await service.update(1, dto);
      expect(res.email).toBe('new@test.com');
      expect(res.role.id).toBe(2);
    });

    it('should update user without changing role if role_id not changed', async () => {
      const existingUser = { id: 1, role: { id: 1 }, email: 'old@test.com' };
      const dto: UpdateUserDto = { email: 'new@test.com', role_id: 1 };

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(existingUser);
      (mockRolesService.findOneById as jest.Mock).mockResolvedValue({ id: 1 });
      (mockUserRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const res = await service.update(1, dto);
      expect(res.email).toBe('new@test.com');
      expect(res.role.id).toBe(1);
    });

    it('should throw NotFoundException if user not found', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, {} as UpdateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePassword', () => {
    it('should hash new password and save user', async () => {
      const user = { id: 1, password_hash: 'old' };
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(user);
      (mockUserRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve(u),
      );

      const res = await service.updatePassword(1, 'newpass');
      expect(res.password_hash).toBe('hashed-pass');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 10);
    });

    it('should throw NotFoundException if user not found', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.updatePassword(999, 'pass')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
