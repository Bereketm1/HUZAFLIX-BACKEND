import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { Request } from 'express';
import {
  getJwtServiceSingleton,
  getSessionClientSingleton,
} from '../internal/singletons';

interface JwtPayload {
  id?: number;
  type?: string;
  [key: string]: unknown;
}

interface SessionRecord {
  token: string;
  revoked?: boolean;
  used_at?: Date | null;
  expires_at?: Date | null;
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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const authHeader = request.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string')
      throw new UnauthorizedException('Missing Authorization header');

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token)
      throw new UnauthorizedException('Invalid Authorization format');

    const payload = await this.verifyToken(token);
    if (!payload || payload.type !== this.validatingType)
      throw new UnauthorizedException('Invalid token type');

    const sessionClient = getSessionClientSingleton();
    if (!sessionClient)
      throw new UnauthorizedException('Session service unavailable');

    try {
      await sessionClient.connect();
    } catch {
      throw new UnauthorizedException('Session service unavailable');
    }

    let session: SessionRecord | null = null;
    try {
      session = await lastValueFrom(
        sessionClient.send<SessionRecord>('get_session_by_token', token),
      );
    } catch {
      throw new UnauthorizedException(
        'Failed to fetch session from microservice',
      );
    }

    if (!session) throw new UnauthorizedException('Session not found');
    if (session.revoked) throw new UnauthorizedException('Token revoked');
    if (session.used_at) throw new UnauthorizedException('Token already used');
    if (session.expires_at && new Date(session.expires_at) < new Date())
      throw new UnauthorizedException('Token expired');

    let user: UserRecord | null = null;
    try {
      user = await lastValueFrom(
        sessionClient.send<UserRecord>('get_user_by_id', payload.id),
      );
    } catch {
      throw new UnauthorizedException('Failed to fetch user from microservice');
    }
    if (user) {
      request.user = user;
    } else {
      request.user = null;
    }

    return true;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    const jwtService = getJwtServiceSingleton();
    if (!jwtService)
      throw new UnauthorizedException('Token service unavailable');
    try {
      const verified: JwtPayload = await jwtService.verifyAsync(token);
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
