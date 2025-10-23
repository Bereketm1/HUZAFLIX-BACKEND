/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    if (!authHeader) throw new UnauthorizedException('Missing Authorization');

    const parts = authHeader.split(' ');
    if (parts.length !== 2)
      throw new UnauthorizedException('Invalid authorization header');
    const [scheme, token] = parts;
    if (scheme !== 'Bearer' || !token)
      throw new UnauthorizedException('Invalid authorization header');

    let payload: { id?: number } | undefined;
    try {
      if (typeof token !== 'string')
        throw new UnauthorizedException('Invalid token');
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload?.id) throw new UnauthorizedException();

    let user;
    try {
      user = await this.usersService.findOneById(payload.id);
    } catch {
      throw new UnauthorizedException();
    }

    if (!user) throw new UnauthorizedException();
    request.user = user;
    return true;
  }
}
