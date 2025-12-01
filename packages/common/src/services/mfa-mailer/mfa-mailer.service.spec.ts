import { Test, TestingModule } from '@nestjs/testing';
import { MfaMailerService } from './mfa-mailer.service';
import { Transporter } from 'nodemailer';

jest.mock('../../internal/singletons', () => ({
  getMailerSingleton: jest.fn(),
}));

import { getMailerSingleton } from '../../internal/singletons';

describe('MfaMailerService', () => {
  let service: MfaMailerService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue(true);
    (getMailerSingleton as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    } as unknown as Transporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [MfaMailerService],
    }).compile();

    service = module.get<MfaMailerService>(MfaMailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtpEmail', () => {
    it('should call mailer.sendMail with correct params', async () => {
      const to = 'user@example.com';
      const code = '123456';
      const expiresInMinutes = 10;

      await service.sendOtpEmail(to, code, expiresInMinutes);

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: 'Your One-Time Verification Code',
        }),
      );
    });
  });

  describe('sendPasswordResetLink', () => {
    it('should call mailer.sendMail with correct params', async () => {
      const to = 'user@example.com';
      const link = 'https://yourapp.com/reset?token=abc';
      const expiresInMinutes = 60;

      await service.sendPasswordResetLink(to, link, expiresInMinutes);

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: 'Reset Your Password',
        }),
      );
    });
  });
});
