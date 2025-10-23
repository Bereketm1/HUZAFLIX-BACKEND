import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly userService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

  async register(user: RegisterDto): Promise<{ message: string }> {
    await this.userService.create(user);
    return {
      message: 'User registered successfully',
    };
  }

  async login(user: LoginDto): Promise<{ access_token: string }> {
    const { email, password } = user;
    const res = await this.userService.findOneByEmail(email);
    if (
      !res ||
      !(await this.comparePasswords(password, res.password_hash as string))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { id: res.id, email: res.email };
    return {
      access_token: await this.signJwt(payload),
    };
  }

  async requestPasswordReset(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string; token?: string }> {
    const { email } = dto;
    interface ResUser {
      id: number;
      email: string;
    }
    let user: ResUser | undefined;
    try {
      user = await this.userService.findOneByEmail(email);
    } catch {
      // don't reveal whether email exists
      return {
        message:
          'If an account with that email exists, a reset token has been sent',
      };
    }
    // create a session entry with a jti and sign a JWT containing the jti
    const jti = crypto.randomUUID();
    const expiresInSeconds = 60 * 60; // 1 hour
    const expires = new Date(Date.now() + expiresInSeconds * 1000);
    // sign a JWT that includes the user id and the jti
    const token = await this.jwt.signAsync(
      { id: user.id, jti },
      { expiresIn: `${expiresInSeconds}s` },
    );
    await this.sessionsService.create({
      userId: user.id,
      jti,
      token,
      type: 'password_reset',
      expiresAt: expires,
    });
    // In production we'd email the token; for tests return it
    return {
      message:
        'If an account with that email exists, a reset token has been sent',
      token,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;
    // verify token signature and extract jti
    let payload: unknown;
    try {
      payload = (await this.jwt.verifyAsync(token)) as unknown;
    } catch {
      throw new NotFoundException('Invalid token');
    }
    if (!payload || typeof payload !== 'object')
      throw new NotFoundException('Invalid token');
    const { id: userId, jti } = payload as { id?: number; jti?: string };
    if (!userId || !jti) throw new NotFoundException('Invalid token');
    // find session by jti and validate
    const session = await this.sessionsService.findByJti(jti);
    if (session.revoked) throw new UnauthorizedException('Token revoked');
    if (session.usedAt) throw new UnauthorizedException('Token already used');
    if (session.expiresAt && session.expiresAt < new Date())
      throw new UnauthorizedException('Token expired');
    // mark used and update password
    await this.sessionsService.markUsed(session.id);
    await this.userService.updatePassword(userId, newPassword);
    return { message: 'Password has been reset successfully' };
  }

  private async signJwt(payload: Record<string, unknown>) {
    return await this.jwt.signAsync(payload, { expiresIn: '15m' });
  }

  private async comparePasswords(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }
}
