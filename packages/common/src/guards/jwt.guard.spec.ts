// import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
// import { JwtAuthGuard } from './jwt.guard';
// import { JwtService } from '@nestjs/jwt';

// describe('JwtAuthGuard (no service version)', () => {
//   let guard: JwtAuthGuard;

//   const mockJwtService = {
//     verifyAsync: jest.fn(),
//     decode: jest.fn(),
//   } as any as JwtService;

//   const makeContext = (authHeader?: string) => {
//     return {
//       switchToHttp: () => ({
//         getRequest: () => ({
//           headers: { authorization: authHeader },
//           user: null,
//           session: null,
//         }),
//       }),
//     } as unknown as ExecutionContext;
//   };

//   const validUser = { id: 1, email: 'a@b.com' };
//   const validSession = {
//     token: 'valid.token',
//     revoked: false,
//     usedAt: null,
//     expiresAt: new Date(Date.now() + 1000),
//   };

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should allow when token, user, and session are valid', async () => {
//     const ctx = makeContext('Bearer valid.token');

//     (mockJwtService.decode as jest.Mock).mockReturnValue({
//       type: 'access',
//     });
//     (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({ id: 1 });

//     guard = new JwtAuthGuard(mockJwtService, validSession, validUser);

//     await expect(guard.canActivate(ctx)).resolves.toBe(true);
//   });

//   it('should throw when missing authorization header', async () => {
//     const ctx = makeContext(undefined);
//     guard = new JwtAuthGuard(mockJwtService, validSession, validUser);
//     await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
//   });

//   it('should throw when authorization scheme is not Bearer', async () => {
//     const ctx = makeContext('Basic abc');
//     guard = new JwtAuthGuard(mockJwtService, validSession, validUser);
//     await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
//   });

//   it('should throw when token type is invalid', async () => {
//     const ctx = makeContext('Bearer valid.token');
//     (mockJwtService.decode as jest.Mock).mockReturnValue({ type: 'refresh' });
//     guard = new JwtAuthGuard(mockJwtService, validSession, validUser);
//     await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
//   });

//   it('should throw when token verification fails', async () => {
//     const ctx = makeContext('Bearer bad.token');
//     (mockJwtService.decode as jest.Mock).mockReturnValue({ type: 'access' });
//     (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(
//       new Error('bad'),
//     );

//     guard = new JwtAuthGuard(mockJwtService, validSession, validUser);
//     await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
//   });

//   it('should throw when session is missing', async () => {
//     const ctx = makeContext('Bearer valid.token');
//     (mockJwtService.decode as jest.Mock).mockReturnValue({ type: 'access' });
//     (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({ id: 1 });

//     guard = new JwtAuthGuard(mockJwtService, null, validUser);
//     await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
//   });

//   it('should throw when session is expired', async () => {
//     const expiredSession = {
//       ...validSession,
//       expiresAt: new Date(Date.now() - 1000),
//     };
//     const ctx = makeContext('Bearer valid.token');
//     (mockJwtService.decode as jest.Mock).mockReturnValue({ type: 'access' });
//     (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({ id: 1 });

//     guard = new JwtAuthGuard(mockJwtService, expiredSession, validUser);
//     await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
//   });

//   it('should throw when session is revoked', async () => {
//     const revokedSession = { ...validSession, revoked: true };
//     const ctx = makeContext('Bearer valid.token');
//     (mockJwtService.decode as jest.Mock).mockReturnValue({ type: 'access' });
//     (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({ id: 1 });

//     guard = new JwtAuthGuard(mockJwtService, revokedSession, validUser);
//     await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
//   });

//   it('should throw when user is missing', async () => {
//     const ctx = makeContext('Bearer valid.token');
//     (mockJwtService.decode as jest.Mock).mockReturnValue({ type: 'access' });
//     (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({ id: 1 });

//     guard = new JwtAuthGuard(mockJwtService, validSession, null);
//     await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
//   });

//   it('should throw when user id mismatches payload', async () => {
//     const ctx = makeContext('Bearer valid.token');
//     (mockJwtService.decode as jest.Mock).mockReturnValue({ type: 'access' });
//     (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({ id: 2 });

//     guard = new JwtAuthGuard(mockJwtService, validSession, validUser);
//     await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
//   });
// });
