import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensure() {
    const existing = await this.prisma.settings.findUnique({ where: { id: 1 } });
    if (existing) return existing;
    return this.prisma.settings.create({ data: { id: 1 } });
  }

  async get() {
    const s = await this.ensure();
    const { smtpPass, ...rest } = s;
    return {
      ...rest,
      smtpPassSet: Boolean(smtpPass),
    };
  }

  async update(dto: UpdateSettingsDto) {
    await this.ensure();
    const data: Record<string, unknown> = { ...dto };
    if (dto.smtpPass === '') delete data.smtpPass;

    const updated = await this.prisma.settings.update({
      where: { id: 1 },
      data,
    });
    const { smtpPass, ...rest } = updated;
    return { ...rest, smtpPassSet: Boolean(smtpPass) };
  }
}
