/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users.entity';
import { RolesService } from 'src/roles/roles.service';
import * as bcrypt from 'bcryptjs';
import { UnprocessableEntityException } from '@nestjs/common';
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-pass'),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository: Partial<Record<string, jest.Mock>> = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockRolesService: Partial<RolesService> = {
    findOneByName: jest.fn(),
  };

  beforeEach(async () => {
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

  describe('create', () => {
    it('should hash password, assign role and save user', async () => {
      const dto: CreateUserDto = { email: 'a@b.com', password: 'plainpass' };
  const role = { id: 2, name: 'api_consumer' } as any;

  (mockRolesService.findOneByName as jest.Mock).mockResolvedValue(role);
      (mockUserRepository.create as jest.Mock).mockReturnValue({ ...dto });
      (mockUserRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve({ id: 1, ...u }),
      );

      const res = await service.create(dto);

  expect(mockRolesService.findOneByName).toHaveBeenCalledWith('api_consumer');
      expect(bcrypt.hash as jest.Mock).toHaveBeenCalledWith(dto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(res).toHaveProperty('id');
    });

    it('should throw when password is missing', async () => {
      const dto = { email: 'a@b.com' } as CreateUserDto;
      await expect(service.create(dto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
