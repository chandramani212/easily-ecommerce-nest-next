import { Injectable, NotFoundException } from '@nestjs/common';
import { InquiryStatus, Prisma } from '@prisma/client';

import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { toCsv } from '../common/csv.util';
import {
  CreateInquiryDto,
  UpdateInquiryStatusDto,
} from './dto/inquiry.dto';
import {
  classifyLeadSource,
  deriveProvider,
  LEAD_SOURCES,
  type LeadSource,
} from './lead-source.util';

export interface InquiryListQuery {
  q?: string;
  status?: InquiryStatus;
  /** Filter by classified source bucket. */
  source?: string;
  /** Filter by organic vs other: "true" | "false". */
  organic?: string;
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
    const attribution = {
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      referrer: dto.referrer,
    };
    const { source, organic } = classifyLeadSource(attribution);
    const provider = deriveProvider(attribution);

    const inquiry = await this.prisma.inquiry.create({
      data: {
        inquiryType: dto.inquiryType,
        productName: dto.productName ?? null,
        productSku: dto.productSku ?? null,
        productImage: dto.productImage ?? null,
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        company: dto.company ?? null,
        quantity: dto.quantity ?? null,
        message: dto.message ?? null,
        source,
        organic,
        provider,
        medium: dto.utmMedium ?? '',
        campaign: dto.utmCampaign ?? '',
        referrer: dto.referrer ?? '',
      },
    });

    void this.mail.send({
      subject: `New inquiry: ${dto.inquiryType}`,
      html: `
        <h2>New product inquiry</h2>
        <p><b>Type:</b> ${escapeHtml(dto.inquiryType)}</p>
        ${dto.productName ? `<p><b>Product:</b> ${escapeHtml(dto.productName)}</p>` : ''}
        ${dto.productSku ? `<p><b>SKU:</b> ${escapeHtml(dto.productSku)}</p>` : ''}
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

  private buildWhere(query: InquiryListQuery): Prisma.InquiryWhereInput {
    const where: Prisma.InquiryWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.source) where.source = query.source;
    if (query.organic === 'true') where.organic = true;
    if (query.organic === 'false') where.organic = false;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { email: { contains: query.q, mode: 'insensitive' } },
        { company: { contains: query.q, mode: 'insensitive' } },
        { productName: { contains: query.q, mode: 'insensitive' } },
        { message: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async findAll(query: InquiryListQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize ?? '20', 10) || 20),
    );
    const where = this.buildWhere(query);

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

  /**
   * Leads grouped by source over an optional date range, with the headline
   * organic-vs-other split. Powers the dashboard "Leads by source" widget.
   */
  async sourceReport(range: { from?: string; to?: string }) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (range.from) createdAt.gte = new Date(range.from);
    if (range.to) createdAt.lte = new Date(range.to);
    const where: Prisma.InquiryWhereInput =
      range.from || range.to ? { createdAt } : {};

    const [grouped, groupedProvider, organic, total] = await Promise.all([
      this.prisma.inquiry.groupBy({
        by: ['source'],
        where,
        _count: { _all: true },
      }),
      this.prisma.inquiry.groupBy({
        by: ['provider'],
        where: { ...where, provider: { not: '' } },
        _count: { _all: true },
      }),
      this.prisma.inquiry.count({ where: { ...where, organic: true } }),
      this.prisma.inquiry.count({ where }),
    ]);

    const counts = new Map<string, number>(
      grouped.map((g) => [g.source, g._count._all]),
    );
    const bySource = LEAD_SOURCES.map((source: LeadSource) => ({
      source,
      count: counts.get(source) ?? 0,
    }));

    const byProvider = groupedProvider
      .map((g) => ({ provider: g.provider, count: g._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { total, organic, other: total - organic, bySource, byProvider };
  }

  async exportCsv(query: InquiryListQuery): Promise<string> {
    const where = this.buildWhere(query);
    const rows = await this.prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return toCsv(rows, [
      { header: 'Received', value: (i) => i.createdAt },
      { header: 'Name', value: (i) => i.name },
      { header: 'Email', value: (i) => i.email },
      { header: 'Phone', value: (i) => i.phone },
      { header: 'Company', value: (i) => i.company },
      { header: 'Inquiry Type', value: (i) => i.inquiryType },
      { header: 'Product', value: (i) => i.productName },
      { header: 'Product SKU', value: (i) => i.productSku },
      { header: 'Quantity', value: (i) => i.quantity },
      { header: 'Message', value: (i) => i.message },
      { header: 'Source', value: (i) => i.source },
      { header: 'Provider', value: (i) => i.provider },
      { header: 'Organic', value: (i) => (i.organic ? 'Yes' : 'No') },
      { header: 'Campaign', value: (i) => i.campaign },
      { header: 'Status', value: (i) => i.status },
    ]);
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
