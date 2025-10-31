import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtPayload {
  id?: number;
  type?: string;
  [key: string]: unknown;
}

interface SessionRecord {
  token: string;
  revoked?: boolean;
  usedAt?: Date | null;
  expiresAt?: Date | null;
}

interface UserRecord {
  id: number;
  [key: string]: unknown;
}

interface RequestWithAuth extends Request {
  user?: UserRecord | null;
  session?: SessionRecord | null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  protected readonly validatingType: string = 'access';

  constructor(
    protected readonly jwtService: JwtService,
    private readonly session?: SessionRecord | null,
    private readonly user?: UserRecord | null,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
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

    if (!this.session) throw new UnauthorizedException('Session not provided');
    if (this.session.token !== token)
      throw new UnauthorizedException('Token does not match session');
    if (this.session.revoked)
      throw new UnauthorizedException('Token has been revoked');
    if (this.session.usedAt)
      throw new UnauthorizedException('Token has already been used');
    if (this.session.expiresAt && this.session.expiresAt < new Date())
      throw new UnauthorizedException('Token has expired');

    if (!this.user || this.user.id !== payload.id)
      throw new UnauthorizedException('User not provided or mismatched');

    request.user = this.user;

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
