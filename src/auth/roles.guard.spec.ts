import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  const reflector = new Reflector();

  beforeEach(() => {
    guard = new RolesGuard(reflector);
  });

  const makeCtx = (rolesMeta: string[] | undefined, user: unknown) => {
    // mock reflector
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(rolesMeta as any);
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('should allow when no roles metadata provided', () => {
    const ctx = makeCtx(undefined, { role: { name: 'api_consumer' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow when user has required role', () => {
    const ctx = makeCtx(['administrator'], { role: { name: 'administrator' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny when user lacks required role', () => {
    const ctx = makeCtx(['administrator'], { role: { name: 'api_consumer' } });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should deny when user missing role info', () => {
    const ctx = makeCtx(['Admin'], {});
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
