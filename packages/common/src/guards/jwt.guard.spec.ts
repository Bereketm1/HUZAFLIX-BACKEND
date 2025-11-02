import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';
import { JwtService } from '@nestjs/jwt';
jest.mock('../internal/singletons', () => ({
  getJwtServiceSingleton: jest.fn(),
  getSessionClientSingleton: jest.fn(),
}));

import {
  getJwtServiceSingleton,
  getSessionClientSingleton,
} from '../internal/singletons';
import { of } from 'rxjs';

const mockJwtService = {
  verifyAsync: jest.fn(),
} as unknown as JwtService;

const mockSessionClient = {
  connect: jest.fn(),
  send: jest.fn(),
};

const validUser = { id: 1, email: 'a@b.com' };
const validSession = {
  token: 'valid.token',
  revoked: false,
  used_at: null,
  expires_at: new Date(Date.now() + 1000),
};

const makeContext = (authHeader?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: authHeader },
        user: null,
        session: null,
      }),
    }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard (mocked singletons)', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    (getJwtServiceSingleton as jest.Mock).mockReturnValue(mockJwtService);
    (getSessionClientSingleton as jest.Mock).mockReturnValue(mockSessionClient);
    guard = new JwtAuthGuard();
  });

  it('should allow when token, user, and session are valid', async () => {
    const ctx = makeContext('Bearer valid.token');

    (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
      id: 1,
      type: 'access',
    });

    mockSessionClient.connect.mockResolvedValue(true);
    mockSessionClient.send
      .mockReturnValueOnce(of(validSession))
      .mockReturnValueOnce(of(validUser));

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
    (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error());
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw when session is expired', async () => {
    const ctx = makeContext('Bearer valid.token');
    (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
      id: 1,
      type: 'access',
    });
    const expired = {
      ...validSession,
      expires_at: new Date(Date.now() - 1000),
    };

    mockSessionClient.connect.mockResolvedValue(true);
    mockSessionClient.send
      .mockReturnValueOnce(of(expired))
      .mockReturnValueOnce(of(validUser));

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
