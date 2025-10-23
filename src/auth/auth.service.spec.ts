import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockSessionsService = {
    create: jest.fn(),
    findByJti: jest.fn(),
    markUsed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: SessionsService, useValue: mockSessionsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should call usersService.create and return a success message', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123456',
      };
      mockUsersService.create.mockResolvedValue({ id: '1', ...registerDto });

      const result = await service.register(registerDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({ message: 'User registered successfully' });
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: '123456' };
    const userRecord = {
      id: '1',
      email: 'test@example.com',
      password_hash: 'hashed-password',
    };

    it('should return access_token if credentials are correct', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(userRecord);
      const bcryptCompare = jest.fn().mockResolvedValue(true);
      (bcrypt.compare as jest.Mock) = bcryptCompare;
      mockJwtService.signAsync.mockResolvedValue('mocked-jwt-token');

      const result = await service.login(loginDto);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        userRecord.password_hash,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { id: userRecord.id, email: userRecord.email },
        { expiresIn: '15m' },
      );
      expect(result).toEqual({
        access_token: 'mocked-jwt-token',
        message: 'User logged in successfully',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(userRecord);
      const bcryptCompare = jest.fn().mockResolvedValue(false);
      (bcrypt.compare as jest.Mock) = bcryptCompare;

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
