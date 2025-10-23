/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthService - password reset', () => {
  let service: AuthService;

  const mockJwtService = { signAsync: jest.fn() };
  const mockUsersService = {
    findOneByEmail: jest.fn(),
    setPasswordResetToken: jest.fn(),
    findOneByResetToken: jest.fn(),
    updatePasswordAndClearReset: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('requestPasswordReset returns token when email exists', async () => {
    const dto: ForgotPasswordDto = { email: 'a@b.com' };
    mockUsersService.findOneByEmail.mockResolvedValue({
      id: 1,
      email: dto.email,
    });
    mockUsersService.setPasswordResetToken.mockResolvedValue(true);

    const res = await service.requestPasswordReset(dto);
    expect(res).toHaveProperty('token');
    expect(mockUsersService.setPasswordResetToken).toHaveBeenCalled();
  });

  it('requestPasswordReset does not reveal missing email', async () => {
    const dto: ForgotPasswordDto = { email: 'missing@x.com' };
    mockUsersService.findOneByEmail.mockRejectedValue(new Error('not found'));

    const res = await service.requestPasswordReset(dto);
    expect(res).not.toHaveProperty('token');
  });

  it('resetPassword should succeed with valid token', async () => {
    const dto: ResetPasswordDto = { token: 'tok', newPassword: 'newPass123' };
    const user = {
      id: 1,
      password_reset_expires: new Date(Date.now() + 10000),
    };
    mockUsersService.findOneByResetToken.mockResolvedValue(user);
    mockUsersService.updatePasswordAndClearReset.mockResolvedValue(true);

    const res = await service.resetPassword(dto);
    expect(res).toEqual({ message: 'Password has been reset successfully' });
    expect(mockUsersService.updatePasswordAndClearReset).toHaveBeenCalledWith(
      user.id,
      dto.newPassword,
    );
  });

  it('resetPassword should throw on invalid token', async () => {
    const dto: ResetPasswordDto = { token: 'bad', newPassword: 'newPass123' };
    mockUsersService.findOneByResetToken.mockRejectedValue(
      new Error('not found'),
    );

    await expect(service.resetPassword(dto)).rejects.toThrow();
  });

  it('resetPassword should throw on expired token', async () => {
    const dto: ResetPasswordDto = { token: 'tok', newPassword: 'newPass123' };
    const user = {
      id: 1,
      password_reset_expires: new Date(Date.now() - 10000),
    };
    mockUsersService.findOneByResetToken.mockResolvedValue(user);

    await expect(service.resetPassword(dto)).rejects.toThrow();
  });
});
