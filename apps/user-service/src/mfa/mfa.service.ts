import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mfa } from './mfa.entity';
import { UsersService } from 'src/users/users.service';
import bcrypt from 'bcryptjs';
import { MfaMailerService } from '@huzaflix/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { SessionsService } from 'src/sessions/sessions.service';

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(Mfa)
    private readonly mfaRepository: Repository<Mfa>,
    private readonly userService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly mfaMailer: MfaMailerService,
    private readonly jwt: JwtService,
  ) {}

  async createMfa(userId: string): Promise<string> {
    const user = await this.userService.findOneById(Number(userId));

    const prevMfa = await this.mfaRepository.findOne({
      where: { user: { id: +userId }, expired: false },
    });

    const { otp, hash } = await this.generateOtpHash();
    console.log('HAS PREV:', prevMfa);
    if (prevMfa) {
      if (this.otpTimeOutCheck(prevMfa.createdAt, 2)) {
        await this.mfaRepository.update({ id: prevMfa.id }, { expired: true });
      } else {
        throw new BadRequestException(
          "OTP already sent and hasn't expired try again in 2 minutes",
        );
      }
    }
    const mfa = this.mfaRepository.create({ user, otp_hash: hash });
    await this.mfaRepository.save(mfa);
    await this.mfaMailer.sendOtpEmail(user.email, otp, 10);
    return otp;
  }

  async verifyMfa(
    otp: string,
    userId: number,
  ): Promise<{
    verified: boolean;
    token: string | null | undefined;
  }> {
    const user = await this.userService.findOneById(userId);
    const mfa = await this.mfaRepository.findOne({
      where: { user: { id: +userId }, expired: false },
    });

    if (!mfa)
      return {
        verified: false,
        token: null,
      };

    if (mfa) {
      if (this.otpTimeOutCheck(mfa.createdAt)) {
        await this.mfaRepository.update({ id: mfa.id }, { expired: true });
        throw new BadRequestException('OTP has expired');
      }
    }

    const isMatch = await bcrypt.compare(otp, mfa.otp_hash);

    if (!isMatch) throw new UnauthorizedException('Invalid OTP');

    await this.mfaRepository.update({ id: mfa.id }, { expired: true });

    const created = await this.sessionsService.create({
      user: user,
      jti: user.id,
      token: await this.signJwt(
        { id: user.id, jti: user.id, type: 'reset' },
        { expiresIn: '10m' },
      ),
      type: 'reset',
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    return {
      verified: true,
      token: created.token,
    };
  }

  async resendOtp(userId: string): Promise<Mfa> {
    const user = await this.userService.findOneById(Number(userId));
    const { otp, hash } = await this.generateOtpHash();
    const prevMfa = await this.mfaRepository.findOne({
      where: { user, expired: false },
      relations: ['user'],
    });

    if (prevMfa) {
      if (this.otpTimeOutCheck(prevMfa.createdAt, 2)) {
        await this.mfaRepository.update({ id: prevMfa.id }, { expired: true });
      } else {
        throw new BadRequestException("OTP already sent and hasn't expired");
      }
    }

    const mfa = this.mfaRepository.create({ user, otp_hash: hash });
    await this.mfaRepository.save(mfa);
    await this.mfaMailer.sendOtpEmail(user.email, otp, 10);
    return mfa;
  }

  private otpTimeOutCheck(otpTime: Date, difference?: number): boolean {
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - otpTime.getTime();
    const timeDifferenceInMinutes = timeDifference / (1000 * 60);
    return timeDifferenceInMinutes > (difference || 10);
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

  private async generateOtpHash(): Promise<{ otp: string; hash: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(otp, 10);

    return { otp, hash };
  }
}
