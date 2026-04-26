import { Injectable, NotFoundException } from '@nestjs/common';
import { InquiryStatus, Prisma } from '@prisma/client';

import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInquiryDto,
  UpdateInquiryStatusDto,
} from './dto/inquiry.dto';

export interface InquiryListQuery {
  q?: string;
  status?: InquiryStatus;
  page?: string;
  pageSize?: string;
}

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateInquiryDto) {
    const inquiry = await this.prisma.inquiry.create({ data: dto });

    void this.mail.send({
      subject: `New inquiry: ${dto.inquiryType}`,
      html: `
        <h2>New product inquiry</h2>
        <p><b>Type:</b> ${escapeHtml(dto.inquiryType)}</p>
        ${dto.productName ? `<p><b>Product:</b> ${escapeHtml(dto.productName)}</p>` : ''}
        <p><b>Name:</b> ${escapeHtml(dto.name)}</p>
        <p><b>Email:</b> ${escapeHtml(dto.email)}</p>
        ${dto.phone ? `<p><b>Phone:</b> ${escapeHtml(dto.phone)}</p>` : ''}
        ${dto.company ? `<p><b>Company:</b> ${escapeHtml(dto.company)}</p>` : ''}
        ${dto.quantity ? `<p><b>Quantity:</b> ${escapeHtml(dto.quantity)}</p>` : ''}
        ${dto.message ? `<p><b>Message:</b><br>${escapeHtml(dto.message)}</p>` : ''}
      `,
    });

    return { id: inquiry.id, success: true };
  }

  async findAll(query: InquiryListQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize ?? '20', 10) || 20),
    );
    const where: Prisma.InquiryWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
        { company: { contains: query.q, mode: 'insensitive' } },
        { productName: { contains: query.q, mode: 'insensitive' } },
        { message: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.inquiry.count({ where }),
      this.prisma.inquiry.findMany({
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

  async findOne(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    return inquiry;
  }

  async updateStatus(id: string, dto: UpdateInquiryStatusDto) {
    await this.findOne(id);
    return this.prisma.inquiry.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.inquiry.delete({ where: { id } });
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
