import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { Session } from 'src/sessions/sessions.entity';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { RolesService } from 'src/roles/roles.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import type { User } from 'src/users/users.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly userService: UsersService,
    private readonly roleService: RolesService,
    private readonly sessionsService: SessionsService,
  ) {}

  async register(user: RegisterDto): Promise<{ message: string }> {
    const role = await this.roleService.findOneByName('user');
    await this.userService.create({ ...user, role_id: role.id });
    return {
      message: 'User registered successfully',
    };
  }

  async login(
    user: LoginDto,
  ): Promise<{ access_token: string; message: string }> {
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
      message: 'User logged in successfully',
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
    // create a session entry and use its numeric id as the jti
    const expiresInSeconds = 60 * 60; // 1 hour
    const expires = new Date(Date.now() + expiresInSeconds * 1000);
    // create session first so we have an integer id to use as jti
    // create a lightweight User reference to satisfy the relation without
    // loading the full entity from the database
    const userRef = { id: user.id } as User;
    const created = await this.sessionsService.create({
      user: userRef,
      type: 'password_reset',
      expiresAt: expires,
    });
    const jti = created.id;
    // sign a JWT that includes the user id and the jti
    const token = await this.jwt.signAsync(
      { id: user.id, jti },
      { expiresIn: `${expiresInSeconds}s` },
    );
    // update the session with jti and token (use save for updates)
    await this.sessionsService.save({
      id: created.id,
      user: userRef,
      jti,
      token,
      type: 'password_reset',
      expiresAt: expires,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    } as Session);
    // In production we'd email the token; for tests return it
    return {
      message:
        'If an account with that email exists, a reset token has been sent',
      token,
    };
  }

  async resetPassword(
    token: string,
    dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { newPassword } = dto;
    // verify token signature and extract jti
    let payload: unknown;
    try {
      payload = (await this.jwt.verifyAsync(token)) as unknown;
    } catch {
      throw new NotFoundException('Invalid token');
    }
    if (!payload || typeof payload !== 'object')
      throw new NotFoundException('Invalid token');
    const { id: userId, jti } = payload as { id?: number; jti?: number };
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

  /**
   * Handle OAuth login (Google). If user exists, return token. Otherwise create user and return token.
   */
  async loginWithOAuth(profile: { email?: string; name?: string }) {
    // Important security: only accept OAuth logins when the provider token has
    // already been validated by the controller. Do NOT auto-create users here.
    // Auto-creating allows an attacker to obtain a token for any email.
    if (!profile || !profile.email) {
      throw new Error('Invalid OAuth profile');
    }
    const email = profile.email;
    let user: User | undefined;
    try {
      user = await this.userService.findOneByEmail(email);
    } catch {
      // Do not create users automatically. Require the user to register or
      // perform an explicit account linking flow.
      throw new NotFoundException(
        'No account exists for this email. Please register or link your account.',
      );
    }

    // Optionally: enforce that the user has previously linked their Google
    // account. This project stores arbitrary user metadata; if you want to
    // require linkage, you could check `user.metadata?.google_sub` here.

    const payload = { id: user.id, email: user.email };
    return {
      access_token: await this.signJwt(payload),
      message: 'User logged in successfully',
    };
  }

  private async signJwt(payload: Record<string, unknown>) {
    try {
      return await this.jwt.signAsync(payload, { expiresIn: '15m' });
    } catch (err) {
      // allow Nest to handle the exception but provide a clearer message
      throw new Error(`Failed to sign JWT: ${(err as Error).message}`);
    }
  }

  private async comparePasswords(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }
}
