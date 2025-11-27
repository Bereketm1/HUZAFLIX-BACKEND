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

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(Mfa)
    private readonly mfaRepository: Repository<Mfa>,
    private readonly userService: UsersService,
    private readonly mfaMailer: MfaMailerService,
    private readonly jwt: JwtService,
  ) {}

  async createMfa(userId: string): Promise<string> {
    const user = await this.userService.findOneById(Number(userId));
    const { otp, hash } = await this.generateOtpHash();
    const prevMfa = await this.mfaRepository.findOne({
      where: { user, expired: false },
    });
    if (prevMfa) {
      if (this.otpTimeOutCheck(prevMfa.createdAt)) {
        await this.mfaRepository.update({ id: prevMfa.id }, { expired: true });
      } else {
        throw new BadRequestException("OTP already sent and hasn't expired");
      }
    }
    const mfa = this.mfaRepository.create({ user, otp_hash: hash });
    await this.mfaRepository.save(mfa);
    await this.mfaMailer.sendOtpEmail(user.email, otp, 10);
    return otp;
  }

  async verifyMfa(otp: string): Promise<boolean> {
    const hash = await bcrypt.hash(otp, 10);
    const mfa = await this.mfaRepository.findOne({
      where: { otp_hash: hash, expired: false },
    });

    if (!mfa) return false;

    if (mfa) {
      if (this.otpTimeOutCheck(mfa.createdAt)) {
        await this.mfaRepository.update({ id: mfa.id }, { expired: true });
      } else {
        throw new BadRequestException('OTP has expired');
      }
    }

    const isMatch = await bcrypt.compare(otp, mfa.otp_hash);

    if (!isMatch) throw new UnauthorizedException('Invalid OTP');

    await this.mfaRepository.update({ id: mfa.id }, { expired: true });

    return true;
  }

  async resendOtp(userId: string): Promise<Mfa> {
    const user = await this.userService.findOneById(Number(userId));
    const { otp, hash } = await this.generateOtpHash();
    const prevMfa = await this.mfaRepository.findOne({
      where: { user, expired: false },
    });

    if (prevMfa) {
      if (this.otpTimeOutCheck(prevMfa.createdAt)) {
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

  private otpTimeOutCheck(otpTime: Date): boolean {
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - otpTime.getTime();
    const timeDifferenceInMinutes = timeDifference / (1000 * 60);
    return timeDifferenceInMinutes > 5;
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
