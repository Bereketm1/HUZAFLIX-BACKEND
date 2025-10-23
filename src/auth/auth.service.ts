import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
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
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userService.setPasswordResetToken(user.id, token, expires);
    // In production we'd email the token; for tests log/return it
    return {
      message:
        'If an account with that email exists, a reset token has been sent',
      token,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;
    interface TokenUser {
      id: number;
      password_reset_expires?: Date | null;
    }
    let user: TokenUser | undefined;
    try {
      user = await this.userService.findOneByResetToken(token);
    } catch {
      throw new NotFoundException('Invalid token');
    }
    if (
      !user?.password_reset_expires ||
      user.password_reset_expires < new Date()
    ) {
      throw new UnauthorizedException('Token expired');
    }
    await this.userService.updatePasswordAndClearReset(user.id, newPassword);
    return { message: 'Password has been reset successfully' };
  }

  private async signJwt(payload: Record<string, unknown>) {
    return await this.jwt.signAsync(payload, { expiresIn: '15m' });
  }

  private async comparePasswords(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }
}
