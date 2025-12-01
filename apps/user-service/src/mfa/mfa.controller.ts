import { Controller, Post, Body, UseGuards, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MfaService } from './mfa.service';
import { CurrentUser, OtpGuard } from '@huzaflix/common';
import { User } from 'src/users/users.entity';

@ApiTags('mfa')
@Controller('mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('verify')
  @ApiBearerAuth()
  @UseGuards(OtpGuard)
  @ApiOperation({ summary: 'Verify MFA OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiQuery({ name: 'otp', required: true })
  async verifyMfa(
    @Query('otp') otp: string,
    @CurrentUser() user: User,
  ): Promise<{ verified: boolean }> {
    const ok = await this.mfaService.verifyMfa(otp, user.id);
    return ok;
  }

  @Post('resend')
  @ApiOperation({ summary: 'Resend OTP for MFA' })
  @ApiResponse({ status: 201, description: 'New OTP sent' })
  async resend(@CurrentUser() user: User) {
    await this.mfaService.resendOtp(user.id.toString());
    return { message: 'New OTP sent successfully' };
  }
}
