import { Injectable } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import { getMailerSingleton } from '../../internal/singletons';

@Injectable()
export class MfaMailerService {
  private mailer: Transporter;

  constructor() {
    const instance = getMailerSingleton();
    if (!instance) {
      throw new Error('Mailer singleton is not initialized');
    }
    this.mailer = instance;
  }

  async sendOtpEmail(to: string, code: string, expiresInMinutes = 10) {
    await this.mailer.sendMail({
      to,
      subject: 'Your One-Time Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verification Code</h2>
          <p>Your one-time code is:</p>
          <h1 style="background: #f0f0f0; padding: 10px; width: fit-content;">${code}</h1>
          <p>Expires in <strong>${expiresInMinutes} minutes</strong>.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetLink(to: string, link: string, expiresInMinutes = 60) {
    await this.mailer.sendMail({
      to,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password:</p>
          <a
            href="${link}"
            style="display: inline-block; background: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;"
          >
            Reset Password
          </a>
          <p>This link expires in <strong>${expiresInMinutes} minutes</strong>.</p>
        </div>
      `,
    });
  }
}
