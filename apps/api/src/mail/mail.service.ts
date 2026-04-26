import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { PrismaService } from '../prisma/prisma.service';

export interface MailOptions {
  subject: string;
  html: string;
  to?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getSettings() {
    return this.prisma.settings.findUnique({ where: { id: 1 } });
  }

  private buildTransport(s: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpSecure: boolean;
  }): Transporter {
    return nodemailer.createTransport({
      host: s.smtpHost,
      port: s.smtpPort,
      secure: s.smtpSecure,
      auth:
        s.smtpUser || s.smtpPass
          ? { user: s.smtpUser, pass: s.smtpPass }
          : undefined,
    });
  }

  async send(options: MailOptions): Promise<{ sent: boolean; reason?: string }> {
    const settings = await this.getSettings();
    if (!settings || !settings.smtpHost) {
      this.logger.warn('SMTP not configured; skipping email');
      return { sent: false, reason: 'SMTP not configured' };
    }

    const to = options.to || settings.notifyTo;
    if (!to) {
      return { sent: false, reason: 'No recipient configured' };
    }

    try {
      const transporter = this.buildTransport(settings);
      await transporter.sendMail({
        from: settings.smtpFrom || settings.smtpUser,
        to,
        subject: options.subject,
        html: options.html,
      });
      return { sent: true };
    } catch (e) {
      this.logger.error(
        'Failed to send email',
        e instanceof Error ? e.stack : String(e),
      );
      return {
        sent: false,
        reason: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  }

  async sendTest(to: string) {
    return this.send({
      to,
      subject: 'ShopEase: SMTP test email',
      html: `<p>This is a test email from your ShopEase admin panel.</p><p>If you received this, your SMTP configuration is working.</p>`,
    });
  }
}
