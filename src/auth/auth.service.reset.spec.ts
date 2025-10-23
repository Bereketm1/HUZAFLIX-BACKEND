import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthService - password reset', () => {
  let service: AuthService;

  const mockJwtService: Partial<JwtService> = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const mockUsersService: Partial<UsersService> = {
    findOneByEmail: jest.fn(),
    updatePassword: jest.fn(),
  };
  const mockSessionsService: Partial<SessionsService> = {
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
    jest.clearAllMocks();
  });

  it('requestPasswordReset returns token when email exists', async () => {
    const dto: ForgotPasswordDto = { email: 'a@b.com' };
    (mockUsersService.findOneByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      email: dto.email,
    });
    // mock signAsync to return a token and sessionsService.create to be called
    (mockJwtService.signAsync as jest.Mock).mockResolvedValue('signed-token');
    (mockSessionsService.create as jest.Mock).mockResolvedValue(true);

    const res = await service.requestPasswordReset(dto);
    expect(res).toHaveProperty('token', 'signed-token');
    expect(mockSessionsService.create).toHaveBeenCalled();
  });

  it('requestPasswordReset does not reveal missing email', async () => {
    const dto: ForgotPasswordDto = { email: 'missing@x.com' };
    (mockUsersService.findOneByEmail as jest.Mock).mockRejectedValue(
      new Error('not found'),
    );

    const res = await service.requestPasswordReset(dto);
    expect(res).not.toHaveProperty('token');
  });

  it('resetPassword should succeed with valid token', async () => {
    const dto: ResetPasswordDto = { token: 'tok', newPassword: 'newPass123' };
    // mock jwt.verifyAsync to return payload with id and jti
    (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
      id: 1,
      jti: 'jti-123',
    });
    (mockSessionsService.findByJti as jest.Mock).mockResolvedValue({
      id: 'sess-1',
      userId: 1,
      revoked: false,
      usedAt: null,
      expiresAt: new Date(Date.now() + 10000),
    });
    (mockUsersService.updatePassword as jest.Mock).mockResolvedValue(true);

    const res = await service.resetPassword(dto);
    expect(res).toEqual({ message: 'Password has been reset successfully' });
    expect(mockSessionsService.markUsed).toHaveBeenCalledWith('sess-1');
    expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
      1,
      dto.newPassword,
    );
  });

  it('resetPassword should throw on invalid token', async () => {
    const dto: ResetPasswordDto = { token: 'bad', newPassword: 'newPass123' };
    (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(
      new Error('invalid token'),
    );

    await expect(service.resetPassword(dto)).rejects.toThrow(NotFoundException);
    await expect(service.resetPassword(dto)).rejects.toThrow('Invalid token');
  });

  it('resetPassword should throw on expired token', async () => {
    const dto: ResetPasswordDto = { token: 'tok', newPassword: 'newPass123' };
    (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
      id: 1,
      jti: 'jti-123',
    });
    (mockSessionsService.findByJti as jest.Mock).mockResolvedValue({
      id: 'sess-1',
      userId: 1,
      revoked: false,
      usedAt: null,
      expiresAt: new Date(Date.now() - 10000),
    });

    await expect(service.resetPassword(dto)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(service.resetPassword(dto)).rejects.toThrow('Token expired');
  });
});
