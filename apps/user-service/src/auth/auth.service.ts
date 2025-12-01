import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { RolesService } from 'src/roles/roles.service';
import { AuditService } from 'src/audit/audit.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import type { User } from 'src/users/users.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly userService: UsersService,
    private readonly roleService: RolesService,
    private readonly sessionsService: SessionsService,
    private readonly auditService?: AuditService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async register(user: RegisterDto): Promise<{ message: string }> {
    const role = await this.roleService.findOneByName('api_consumer');
    const created = await this.userService.create({
      ...user,
      role_id: role.id,
    });
    // best-effort audit
    try {
      await this.auditService?.createAudit({
        actor_id: String(created.id),
        event: 'user.register',
        resource_type: 'user',
        resource_id: String(created.id),
        metadata: { email: created.email },
      });
    } catch (err: unknown) {
      // Audit is best-effort, log failure
      this.logger.warn(
        'Failed to create audit for register: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
    return {
      message: 'User registered successfully',
    };
  }

  async login(
    user: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password } = user;
    const res = await this.userService.findOneByEmail(email);
    if (
      !res ||
      !(await this.comparePasswords(password, res.password_hash as string))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { id: res.id, email: res.email };
    await this.sessionsService.deactivateAllOldSessions(res.id);
    const accessSession = await this.sessionsService.create({
      user: res,
      jti: res.id,
      type: 'access',
      token: await this.signJwt({
        ...payload,
        type: 'access',
        role: res.role.name,
      }),
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    });

    const refreshSession = await this.sessionsService.create({
      user: res,
      jti: res.id,
      type: 'refresh',
      token: await this.signJwt(
        { ...payload, type: 'refresh' },
        { expiresIn: '7d' },
      ),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    try {
      await this.auditService?.createAudit({
        actor_id: String(res.id),
        event: 'user.login',
        resource_type: 'user',
        resource_id: String(res.id),
      });
    } catch (err: unknown) {
      this.logger.warn(
        'Failed to create audit for login: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }

    return {
      access_token: accessSession.token as string,
      refresh_token: refreshSession.token as string,
    };
  }

  async refresh(
    token: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const session = await this.sessionsService.findByToken(token);
    if (!session || session.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.userService.findOneById(session.jti as number);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    const payload = { id: user.id, email: user.email };
    await this.sessionsService.deactivateAllOldSessions(user.id);
    const accessSession = await this.sessionsService.create({
      user: user,
      jti: user.id,
      type: 'access',
      token: await this.signJwt({ ...payload, type: 'access' }),
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    });

    const refreshSession = await this.sessionsService.create({
      user: user,
      jti: user.id,
      type: 'refresh',
      token: await this.signJwt({
        ...payload,
        type: 'access',
        role: user.role.name,
      }),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return {
      access_token: accessSession.token as string,
      refresh_token: refreshSession.token as string,
    };
  }

  async updatePassword(
    userId: number,
    dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = dto;
    const user = await this.userService.findOneById(userId);
    if (!user) throw new NotFoundException('User not found');
    const isMatch: boolean = await this.comparePasswords(
      currentPassword,
      user.password_hash as string,
    );
    if (!isMatch) throw new UnauthorizedException('Invalid password');
    await this.userService.updatePassword(userId, newPassword);
    return { message: 'Password updated successfully' };
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
      const created = await this.sessionsService.create({
        user: user as User,
        jti: (user as User).id,
        token: await this.signJwt(
          { id: user.id, jti: user.id, type: 'reset' },
          { expiresIn: '5m' },
        ),
        type: 'reset',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      });
      return {
        message:
          'If an account with that email exists, a reset token has been sent',
        token: created.token as string,
      };
    } catch {
      return {
        message:
          'If an account with that email exists, a reset token has been sent',
      };
    }
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
    const session = await this.sessionsService.findByToken(token);
    if (session.revoked) throw new UnauthorizedException('Token revoked');
    if (session.used_at) throw new UnauthorizedException('Token already used');
    if (session.expires_at && session.expires_at < new Date())
      throw new UnauthorizedException('Token expired');
    // mark used and update password
    await this.sessionsService.markUsed(session.id);
    await this.userService.updatePassword(userId, newPassword);
    try {
      await this.auditService?.createAudit({
        actor_id: String(userId),
        event: 'password.reset',
        resource_type: 'user',
        resource_id: String(userId),
      });
    } catch (err: unknown) {
      this.logger.warn(
        'Failed to create audit for password reset: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
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

  async logout(token: string) {
    // Verify token signature to ensure token was issued by this service.
    let payload: unknown;
    try {
      payload = (await this.jwt.verifyAsync(token)) as unknown;
    } catch {
      throw new NotFoundException('Invalid token');
    }

    if (!payload || typeof payload !== 'object' || !('id' in payload)) {
      throw new NotFoundException('Invalid token');
    }

    const idVal = (payload as Record<string, unknown>).id;
    const id = typeof idVal === 'number' ? idVal : Number(idVal);
    if (Number.isNaN(id)) throw new NotFoundException('Invalid token');
    const user = await this.userService.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.sessionsService.deactivateAllOldSessions(user.id);
    return { message: 'User logged out successfully' };
  }

  private async signJwt(
    payload: Record<string, unknown>,
    options?: JwtSignOptions,
  ) {
    try {
      return await this.jwt.signAsync(payload, options || { expiresIn: '15m' });
    } catch (err) {
      // allow Nest to handle the exception but provide a clearer message
      throw new Error(`Failed to sign JWT: ${(err as Error).message}`);
    }
  }

  private async comparePasswords(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }
}
