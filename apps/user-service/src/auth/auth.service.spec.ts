import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { RolesService } from 'src/roles/roles.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { AuditService } from 'src/audit/audit.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    findOneById: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockSessionsService = {
    create: jest.fn(),
    findByJti: jest.fn(),
    markUsed: jest.fn(),
    save: jest.fn(),
    findByToken: jest.fn(),
    deactivateAllOldSessions: jest.fn(),
  };

  const mockRolesService = {
    findOneByName: jest.fn(),
    findOneById: jest.fn(),
  };
  const mockAuditService = {
    createAudit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: RolesService, useValue: mockRolesService },
        { provide: SessionsService, useValue: mockSessionsService },
        { provide: AuditService, useValue: mockAuditService },
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
      expect(mockAuditService.createAudit).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: '123456' };
    const userRecord = {
      id: '1',
      email: 'test@example.com',
      password_hash: 'hashed-password',
      role: { id: '1', name: 'user' },
    };

    it('should return access_token if credentials are correct', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(userRecord);
      const bcryptCompare = jest.fn().mockResolvedValue(true);
      (bcrypt.compare as jest.Mock) = bcryptCompare;
      mockJwtService.signAsync.mockResolvedValue('mocked-jwt-token');
      mockSessionsService.create.mockResolvedValue({
        token: 'mocked-jwt-token',
      });
      const result = await service.login(loginDto);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        userRecord.password_hash,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          id: userRecord.id,
          email: userRecord.email,
          type: 'access',
          role: userRecord.role.name,
        },
        { expiresIn: '15m' },
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          id: userRecord.id,
          email: userRecord.email,
          type: 'refresh',
        },
        { expiresIn: '7d' },
      );

      expect(result).toEqual({
        access_token: 'mocked-jwt-token',
        refresh_token: 'mocked-jwt-token',
      });
      expect(mockAuditService.createAudit).toHaveBeenCalled();
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

  describe('refreshToken', () => {
    it('should throw UnauthorizedException if session not found', async () => {
      mockSessionsService.findByToken.mockResolvedValue(null);

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if session type is not refresh', async () => {
      mockSessionsService.findByToken.mockResolvedValue({
        id: 1,
        type: 'access',
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockSessionsService.findByToken.mockResolvedValue({
        id: 1,
        type: 'refresh',
        user: { id: 1 },
      });
      mockUsersService.findOneById.mockResolvedValue(null);

      await expect(service.refresh('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new access token if session is valid', async () => {
      mockSessionsService.findByToken.mockResolvedValue({
        id: 1,
        type: 'refresh',
        user: { id: 1 },
      });
      mockUsersService.findOneById.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        role: { id: 1, name: 'user' },
      });
      mockJwtService.signAsync.mockResolvedValue('new-access-token');
      mockSessionsService.create.mockResolvedValue({
        token: 'mocked-jwt-token',
      });

      const res = await service.refresh('valid-token');
      expect(res).toEqual({
        access_token: 'mocked-jwt-token',
        refresh_token: 'mocked-jwt-token',
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { id: 1, email: 'user@example.com', type: 'access' },
        { expiresIn: '15m' },
      );
    });
  });

  describe('AuthService - password reset', () => {
    it('requestPasswordReset returns token when email exists', async () => {
      const dto: ForgotPasswordDto = { email: 'a@b.com' } as ForgotPasswordDto;
      mockUsersService.findOneByEmail.mockResolvedValue({
        id: 1,
        email: dto.email,
      });

      mockJwtService.signAsync.mockResolvedValue('signed-token');
      mockSessionsService.create.mockResolvedValue({
        id: 1,
        token: 'signed-token',
      });

      const res = await service.requestPasswordReset(dto);
      expect(res).toHaveProperty('token', 'signed-token');
      expect(mockSessionsService.create).toHaveBeenCalled();
    });

    it('requestPasswordReset does not reveal missing email', async () => {
      const dto: ForgotPasswordDto = {
        email: 'missing@x.com',
      } as ForgotPasswordDto;
      mockUsersService.findOneByEmail.mockRejectedValue(new Error('not found'));

      const res = await service.requestPasswordReset(dto);
      expect(res).not.toHaveProperty('token');
    });

    it('resetPassword should succeed with valid token', async () => {
      const token = 'tok';
      const dto: ResetPasswordDto = {
        newPassword: 'newPass123',
      } as ResetPasswordDto;
      mockJwtService.verifyAsync.mockResolvedValue({
        id: 1,
        jti: 123,
      });
      mockSessionsService.findByJti.mockResolvedValue({
        id: 1,
        userId: 1,
        revoked: false,
        used_at: null,
        expires_at: new Date(Date.now() + 10000),
      });
      mockUsersService.updatePassword.mockResolvedValue(true);

      const res = await service.resetPassword(token, dto);
      expect(res).toEqual({ message: 'Password has been reset successfully' });
      expect(mockSessionsService.markUsed).toHaveBeenCalledWith(1);
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        1,
        dto.newPassword,
      );
      expect(mockAuditService.createAudit).toHaveBeenCalled();
    });

    it('resetPassword should throw on invalid token', async () => {
      const token = 'bad';
      const dto: ResetPasswordDto = {
        newPassword: 'newPass123',
      } as ResetPasswordDto;
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

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
      mockJwtService.verifyAsync.mockResolvedValue({
        id: 1,
        jti: 123,
      });
      mockSessionsService.findByToken.mockResolvedValue({
        id: 1,
        userId: 1,
        revoked: false,
        used_at: null,
        expires_at: new Date(Date.now() - 10000),
      });

      await expect(service.resetPassword(token, dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.resetPassword(token, dto)).rejects.toThrow(
        'Token expired',
      );
    });

    describe('logout', () => {
      it('logout should deactivate all old sessions', async () => {
        mockJwtService.decode.mockResolvedValue({
          id: 1,
        });
        await service.logout('token');
        expect(
          mockSessionsService.deactivateAllOldSessions,
        ).toHaveBeenCalledWith(1);
      });
    });
  });
});
