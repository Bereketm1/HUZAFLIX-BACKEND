import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly reflector: Reflector;

  constructor(reflector?: Reflector) {
    this.reflector = reflector ?? new Reflector();
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const rawRequest: ExecutionContext = context.switchToHttp().getRequest();
    const request = rawRequest as { user?: { role?: { name?: string } } };
    const roleName: string | undefined = request.user?.role?.name;
    if (!roleName) throw new ForbiddenException('Access denied');

    const hasRole = requiredRoles.includes(roleName);
    if (!hasRole) throw new ForbiddenException('Access denied');
    return true;
  }
}
