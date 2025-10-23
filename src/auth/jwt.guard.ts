import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

interface JwtPayload {
  id?: number;
  [key: string]: unknown;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // get request as unknown then narrow to a typed shape to avoid `any`
    // getRequest is typed as any by the framework; narrow via unknown.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rawRequest = context.switchToHttp().getRequest();
    const request = rawRequest as {
      headers?: Record<string, string | string[]>;
      user?: unknown;
    };
    const rawAuth = request.headers?.authorization;
    const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
    if (!authHeader || typeof authHeader !== 'string')
      throw new UnauthorizedException('Missing Authorization');

    const parts = authHeader.split(' ');
    if (parts.length !== 2)
      throw new UnauthorizedException('Invalid authorization header');
    const [scheme, token] = parts;
    if (scheme !== 'Bearer' || !token)
      throw new UnauthorizedException('Invalid authorization header');

    let payload: JwtPayload | undefined;
    try {
      if (typeof token !== 'string')
        throw new UnauthorizedException('Invalid token');
      // verifyAsync returns unknown; cast safely after runtime checks
      const verified = (await this.jwtService.verifyAsync(token)) as unknown;
      if (!verified || typeof verified !== 'object')
        throw new UnauthorizedException('Invalid or expired token');
      payload = verified as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload?.id) throw new UnauthorizedException();

    let user: Awaited<ReturnType<UsersService['findOneById']>> | undefined;
    try {
      user = await this.usersService.findOneById(payload.id);
    } catch {
      throw new UnauthorizedException();
    }

    if (!user) throw new UnauthorizedException();
    // assign with an explicit cast to avoid unsafe-member-access lint issues
    request.user = user as unknown;
    return true;
  }
}
