import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users.entity';
import { RolesService } from 'src/roles/roles.service';
import { Role } from 'src/roles/roles.entity';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-pass'),
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository: Partial<Repository<User>> = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockRolesService: Partial<RolesService> = {
    findOneByName: jest.fn(),
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

  describe('create', () => {
    it('should hash password, assign role and save user', async () => {
      const dto: CreateUserDto = {
        email: 'a@b.com',
        password: 'plainpass',
        role_id: 1,
      };
      const role: Partial<Role> = { id: 2, name: 'api_consumer' };

      (mockRolesService.findOneByName as jest.Mock).mockResolvedValue(
        role as Role,
      );
      (mockUserRepository.create as jest.Mock).mockReturnValue({ ...dto });
      (mockUserRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve({ id: 1, ...u }),
      );

      const res = await service.create(dto);

      expect(mockRolesService.findOneById).toHaveBeenCalledWith(1);
      expect(bcrypt.hash as jest.Mock).toHaveBeenCalledWith(dto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(res).toHaveProperty('id');
    });

    it('should allow creation when password is missing (used by OAuth flows)', async () => {
      const dto = { email: 'a@b.com' } as CreateUserDto;
      (mockUserRepository.create as jest.Mock).mockReturnValue({ ...dto });
      (mockUserRepository.save as jest.Mock).mockImplementation((u) =>
        Promise.resolve({ id: 1, ...u }),
      );

      const res = await service.create(dto);
      expect(res).toHaveProperty('id');
      expect(bcrypt.hash as jest.Mock).not.toHaveBeenCalled();
    });
  });
});
