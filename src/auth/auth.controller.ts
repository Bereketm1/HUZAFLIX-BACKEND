import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { type RegisterDto } from './dto/register.dto';
import { type LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ access_token: Promise<string> }> {
    return this.authService.login(dto);
  }
}
