import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { RolesService } from 'src/roles/roles.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockSessionsService = {
    create: jest.fn(),
    findByJti: jest.fn(),
    markUsed: jest.fn(),
    save: jest.fn(),
  };

  const mockRolesService = {
    findOneByName: jest.fn(),
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: RolesService, useValue: mockRolesService },
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
      mockRolesService.findOneByName.mockResolvedValue({
        id: '1',
        name: 'user',
      });

      const result = await service.register(registerDto);

      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        role_id: '1',
      });
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

describe('AuthService - password reset', () => {
  let service: AuthService;

  const mockJwtService2: Partial<JwtService> = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const mockUsersService2: Partial<UsersService> = {
    findOneByEmail: jest.fn(),
    updatePassword: jest.fn(),
  };
  const mockSessionsService2: Partial<SessionsService> = {
    create: jest.fn(),
    findByJti: jest.fn(),
    markUsed: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService2 },
        { provide: UsersService, useValue: mockUsersService2 },
        { provide: SessionsService, useValue: mockSessionsService2 },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('requestPasswordReset returns token when email exists', async () => {
    const dto: ForgotPasswordDto = { email: 'a@b.com' } as ForgotPasswordDto;
    (mockUsersService2.findOneByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      email: dto.email,
    });
    (mockJwtService2.signAsync as jest.Mock).mockResolvedValue('signed-token');
    (mockSessionsService2.create as jest.Mock).mockResolvedValue(true);

    const res = await service.requestPasswordReset(dto);
    expect(res).toHaveProperty('token', 'signed-token');
    expect(mockSessionsService2.create).toHaveBeenCalled();
  });

  it('requestPasswordReset does not reveal missing email', async () => {
    const dto: ForgotPasswordDto = {
      email: 'missing@x.com',
    } as ForgotPasswordDto;
    (mockUsersService2.findOneByEmail as jest.Mock).mockRejectedValue(
      new Error('not found'),
    );

    const res = await service.requestPasswordReset(dto);
    expect(res).not.toHaveProperty('token');
  });

  it('resetPassword should succeed with valid token', async () => {
    const token = 'tok';
    const dto: ResetPasswordDto = {
      newPassword: 'newPass123',
    } as ResetPasswordDto;
    (mockJwtService2.verifyAsync as jest.Mock).mockResolvedValue({
      id: 1,
      jti: 123,
    });
    (mockSessionsService2.findByJti as jest.Mock).mockResolvedValue({
      id: 1,
      userId: 1,
      revoked: false,
      usedAt: null,
      expiresAt: new Date(Date.now() + 10000),
    });
    (mockUsersService2.updatePassword as jest.Mock).mockResolvedValue(true);

  const res = await service.resetPassword(token, dto);
    expect(res).toEqual({ message: 'Password has been reset successfully' });
    expect(mockSessionsService2.markUsed).toHaveBeenCalledWith(1);
    expect(mockUsersService2.updatePassword).toHaveBeenCalledWith(
      1,
      dto.newPassword,
    );
  });

  it('resetPassword should throw on invalid token', async () => {
    const token = 'bad';
    const dto: ResetPasswordDto = {
      newPassword: 'newPass123',
    } as ResetPasswordDto;
    (mockJwtService2.verifyAsync as jest.Mock).mockRejectedValue(
      new Error('invalid token'),
    );

    await expect(service.resetPassword(token, dto)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.resetPassword(token, dto)).rejects.toThrow(
      'Invalid token',
    );
  });

  it('resetPassword should throw on expired token', async () => {
    const token = 'tok';
    const dto: ResetPasswordDto = {
      newPassword: 'newPass123',
    } as ResetPasswordDto;
    (mockJwtService2.verifyAsync as jest.Mock).mockResolvedValue({
      id: 1,
      jti: 123,
    });
    (mockSessionsService2.findByJti as jest.Mock).mockResolvedValue({
      id: 1,
      userId: 1,
      revoked: false,
      usedAt: null,
      expiresAt: new Date(Date.now() - 10000),
    });

    await expect(service.resetPassword(token, dto)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(service.resetPassword(token, dto)).rejects.toThrow(
      'Token expired',
    );
  });
});
