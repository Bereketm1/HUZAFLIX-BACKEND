import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  } as any as JwtService;

  const mockUsersService = {
    findOneById: jest.fn(),
  } as any as UsersService;

  beforeEach(() => {
    guard = new JwtAuthGuard(mockJwtService, mockUsersService);
    jest.clearAllMocks();
  });

  const makeContext = (authHeader?: string) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: authHeader } }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow when token is valid and user exists', async () => {
    const ctx = makeContext('Bearer valid.token');
  (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({ id: 1, email: 'a@b.com' });
  (mockUsersService.findOneById as jest.Mock).mockResolvedValue({ id: 1, email: 'a@b.com' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should throw when missing authorization header', async () => {
    const ctx = makeContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when authorization scheme is not Bearer', async () => {
    const ctx = makeContext('Basic abc');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when token verification fails', async () => {
    const ctx = makeContext('Bearer bad.token');
  (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('bad'));
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when user not found', async () => {
    const ctx = makeContext('Bearer valid.token');
  (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({ id: 999 });
  (mockUsersService.findOneById as jest.Mock).mockRejectedValue(new Error('not found'));
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
