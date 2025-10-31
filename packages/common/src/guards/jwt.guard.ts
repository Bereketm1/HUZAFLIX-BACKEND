import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { Request } from 'express';
import { getJwtServiceSingleton, getSessionClientSingleton, getUserClientSingleton } from '../internal/singletons';

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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const authHeader = request.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string')
      throw new UnauthorizedException('Missing Authorization header');

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token)
      throw new UnauthorizedException('Invalid Authorization format');

    // Verify token and check type
    const payload = await this.verifyToken(token);
    if (!payload || payload.type !== this.validatingType)
      throw new UnauthorizedException('Invalid token type');

    // Fetch session dynamically via microservice
    const sessionClient = getSessionClientSingleton();
    if (!sessionClient) throw new UnauthorizedException('Session service unavailable');

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
      throw new UnauthorizedException('Failed to fetch session from microservice');
    }

    if (!session) throw new UnauthorizedException('Session not found');
    if (session.revoked) throw new UnauthorizedException('Token revoked');
    if (session.usedAt) throw new UnauthorizedException('Token already used');
    if (session.expiresAt && new Date(session.expiresAt) < new Date())
      throw new UnauthorizedException('Token expired');

    const userClient = getUserClientSingleton();
    if (!userClient) throw new UnauthorizedException('User service unavailable');

    try {
      await userClient.connect();
    } catch {
      throw new UnauthorizedException('User service unavailable');
    }

    let user: UserRecord | null = null;
    try {
      user = await lastValueFrom(
        userClient.send<UserRecord>('get_user_by_id', payload.id),
      );
    } catch {
      throw new UnauthorizedException('Failed to fetch user from microservice');
    }
    if (user) {
      request.user = user;
    }
    else {
      request.user = null;
    }

    return true;
  }

  private async verifyToken(token: string): Promise<JwtPayload> {
    const jwtService = getJwtServiceSingleton();
    if (!jwtService) throw new UnauthorizedException('Token service unavailable');
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

// ---------------- Access / Refresh / Reset Guards ----------------

@Injectable()
export class RefreshGuard extends JwtAuthGuard {
  protected readonly validatingType = 'refresh';
}

@Injectable()
export class ResetGuard extends JwtAuthGuard {
  protected readonly validatingType = 'reset';
}
