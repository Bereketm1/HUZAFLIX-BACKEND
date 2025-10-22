import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';

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

  private async signJwt(payload: Record<string, unknown>) {
    return await this.jwt.signAsync(payload, { expiresIn: '15m' });
  }

  private async comparePasswords(password: string, hashedPassword: string) {
    return bcrypt.compare(password, hashedPassword);
  }
}
