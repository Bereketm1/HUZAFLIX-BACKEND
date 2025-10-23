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

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token)
      throw new UnauthorizedException('Invalid authorization header');

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload || !payload.id) throw new UnauthorizedException();

    let user: any;
    try {
      user = await this.usersService.findOneById(payload.id as number);
    } catch (err) {
      // translate any error into Unauthorized for security
      throw new UnauthorizedException('User not found');
    }
    if (!user) throw new UnauthorizedException('User not found');

    // attach user to request for downstream handlers
    request.user = user;
    return true;
  }
}
