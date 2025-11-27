import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MfaService } from './mfa.service';
import { CurrentUser, OtpGuard } from '@huzaflix/common';
import { User } from 'src/users/users.entity';

class VerifyMfaDto {
  otp: string;
}

@ApiTags('mfa')
@Controller('mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Post('verify')
  @UseGuards(OtpGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyMfa(@Body() body: VerifyMfaDto): Promise<{ verified: boolean }> {
    const ok = await this.mfaService.verifyMfa(body.otp);
    return { verified: ok };
  }

  @Post('resend')
  @ApiOperation({ summary: 'Resend OTP for MFA' })
  @ApiResponse({ status: 201, description: 'New OTP sent' })
  async resend(@CurrentUser() user: User) {
    await this.mfaService.resendOtp(user.id.toString());
    return { message: 'New OTP sent successfully' };
  }
}
