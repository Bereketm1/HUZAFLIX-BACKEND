import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

type OAuthProfile = { email?: string; name?: string };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 201, description: 'User logged in successfully' })
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ access_token: string; message: string }> {
    return this.authService.login(dto);
  }

  /**
   * Manual Google OAuth flow
   * GET /auth/google -> redirect to Google's OAuth consent screen
   */
  @Get('google')
  googleRedirect(@Res() res: Response) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const callback =
      this.config.get<string>('GOOGLE_CALLBACK_URL') ??
      'http://localhost:3000/auth/google/callback';
    if (!clientId) throw new BadRequestException('Google OAuth not configured');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callback,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.redirect(url);
  }

  /**
   * Callback handler that exchanges `code` for tokens and returns our JWT
   */
  @Get('google/callback')
  async googleCallback(@Query('code') code: string) {
    if (!code) throw new BadRequestException('Missing code');
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET') ?? '';
    const redirectUri =
      this.config.get<string>('GOOGLE_CALLBACK_URL') ??
      'http://localhost:3000/auth/google/callback';
    if (!clientId || !clientSecret)
      throw new BadRequestException('Google OAuth not configured');

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenJson: unknown = await tokenRes.json();
    if (!tokenRes.ok) {
      const err =
        (tokenJson as
          | { error?: string; error_description?: string }
          | undefined) ?? undefined;
      throw new BadRequestException(
        err?.error_description ?? err?.error ?? 'Failed to exchange code',
      );
    }

    if (typeof tokenJson !== 'object' || tokenJson === null) {
      throw new BadRequestException('Invalid token response from provider');
    }
    const idToken = (tokenJson as Record<string, unknown>)['id_token'];
    if (typeof idToken !== 'string')
      throw new BadRequestException('No id_token returned from provider');

    // Verify id_token with Google to ensure it's valid and signed by Google.
    // Using Google's tokeninfo endpoint is a simple server-side verification
    // that confirms signature, expiry and gives us the verified payload.
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        idToken,
      )}`,
    );
    const tokenInfoJson: unknown = await tokenInfoRes.json();
    if (!tokenInfoRes.ok) {
      const err =
        (tokenInfoJson as { error_description?: string; error?: string }) ??
        undefined;
      throw new BadRequestException(
        err?.error_description ?? err?.error ?? 'Invalid id_token',
      );
    }

    if (typeof tokenInfoJson !== 'object' || tokenInfoJson === null) {
      throw new BadRequestException('Invalid tokeninfo response from provider');
    }

    const payload = tokenInfoJson as Record<string, unknown>;

    // Basic checks: audience must match our client id and email must be verified
    if (typeof payload.aud !== 'string' || payload.aud !== clientId) {
      throw new BadRequestException('id_token audience does not match client');
    }
    if (
      payload.iss !== 'https://accounts.google.com' &&
      payload.iss !== 'accounts.google.com'
    ) {
      throw new BadRequestException('Invalid id_token issuer');
    }

    const emailVerifiedRaw = payload.email_verified;
    const emailVerified =
      emailVerifiedRaw === 'true' || emailVerifiedRaw === true || false;
    if (!emailVerified) {
      throw new BadRequestException('Email not verified by provider');
    }

    const profile: OAuthProfile = {
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };

    // Delegate to auth service which will only sign a JWT for an existing, linked user.
    return this.authService.loginWithOAuth(profile);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
