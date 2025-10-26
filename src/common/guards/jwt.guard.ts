import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SessionsService } from 'src/sessions/sessions.service';
import { UsersService } from 'src/users/users.service';

interface JwtPayload {
  id?: number;
  type?: string;
  [key: string]: unknown;
}

interface RequestWithUser extends Request {
  user?: unknown;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  protected readonly validatingType: string = 'access';

  constructor(
    protected readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (typeof authHeader !== 'string')
      throw new UnauthorizedException('Missing Authorization header');

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token)
      throw new UnauthorizedException('Invalid Authorization format');

    const decoded: JwtPayload | null = this.jwtService.decode(token);
    if (!decoded?.type || decoded.type !== this.validatingType)
      throw new UnauthorizedException('Invalid token type');

    const payload = await this.verifyToken(token);

    const session = await this.sessionsService.findByToken(token);
    if (!session || session.revoked || session.usedAt)
      throw new UnauthorizedException('Invalid or revoked token');

    if (session.expiresAt && session.expiresAt < new Date())
      throw new UnauthorizedException('Expired token');

    const user = await this.usersService.findOneById(payload.id as number);
    if (!user) throw new UnauthorizedException('User not found');

    request.user = user;
    return true;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const verified: JwtPayload = await this.jwtService.verifyAsync(token);
      if (!verified || typeof verified !== 'object')
        throw new UnauthorizedException('Invalid token');
      return verified;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

@Injectable()
export class RefreshGuard extends JwtAuthGuard {
  protected readonly validatingType = 'refresh';
}

@Injectable()
export class ResetGuard extends JwtAuthGuard {
  protected readonly validatingType = 'reset';
}
