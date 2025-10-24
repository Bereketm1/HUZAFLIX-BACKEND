import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/common/jwt/jwt.guard';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    findAll: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call userService.findAll and return list of users', async () => {
      const users = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
      ];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should call userService.findOneById and return a user', async () => {
      const user = { id: 1, email: 'test@example.com' };
      mockUsersService.findOneById.mockResolvedValue(user);

      const result = await controller.findOne(1);

      expect(mockUsersService.findOneById).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });
  });

  describe('create', () => {
    it('should call userService.create and return the created user', async () => {
      const dto: CreateUserDto = {
        email: 'new@example.com',
        password: '123456',
        role_id: 1,
      } as CreateUserDto;
      const createdUser = { id: 1, ...dto };
      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await controller.create(dto);

      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(createdUser);
    });
  });

  describe('update', () => {
    it('should call userService.update and return the updated user', async () => {
      const dto: UpdateUserDto = { email: 'updated@example.com' };
      const updatedUser = { id: 1, email: 'updated@example.com' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, dto);

      expect(mockUsersService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedUser);
    });
  });
});
