import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactStatus, Prisma } from '@prisma/client';

import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { toCsv } from '../common/csv.util';
import {
  CreateContactMessageDto,
  UpdateContactMessageStatusDto,
} from './dto/contact-message.dto';

export interface ContactListQuery {
  q?: string;
  status?: ContactStatus;
  page?: string;
  pageSize?: string;
}

@Injectable()
export class ContactMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateContactMessageDto) {
    const msg = await this.prisma.contactMessage.create({ data: dto });

    void this.mail.send({
      subject: `New contact message: ${dto.subject || 'General inquiry'}`,
      html: `
        <h2>New contact message</h2>
        <p><b>Name:</b> ${escapeHtml(`${dto.firstName} ${dto.lastName}`)}</p>
        <p><b>Email:</b> ${escapeHtml(dto.email)}</p>
        ${dto.subject ? `<p><b>Subject:</b> ${escapeHtml(dto.subject)}</p>` : ''}
        <p><b>Message:</b><br>${escapeHtml(dto.message)}</p>
      `,
    });

    return { id: msg.id, success: true };
  }

  private buildWhere(query: ContactListQuery): Prisma.ContactMessageWhereInput {
    const where: Prisma.ContactMessageWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { firstName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
        { subject: { contains: query.q, mode: 'insensitive' } },
        { message: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async findAll(query: ContactListQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize ?? '20', 10) || 20),
    );
    const where = this.buildWhere(query);

    const [total, items] = await Promise.all([
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  async exportCsv(query: ContactListQuery): Promise<string> {
    const where = this.buildWhere(query);
    const rows = await this.prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return toCsv(rows, [
      { header: 'Received', value: (m) => m.createdAt },
      { header: 'First Name', value: (m) => m.firstName },
      { header: 'Last Name', value: (m) => m.lastName },
      { header: 'Email', value: (m) => m.email },
      { header: 'Subject', value: (m) => m.subject },
      { header: 'Message', value: (m) => m.message },
      { header: 'Status', value: (m) => m.status },
    ]);
  }

  async findOne(id: string) {
    const msg = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');
    return msg;
  }

  async updateStatus(id: string, dto: UpdateContactMessageStatusDto) {
    await this.findOne(id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.contactMessage.delete({ where: { id } });
    return { success: true };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}
