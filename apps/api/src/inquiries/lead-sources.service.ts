import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLeadSourceDto,
  UpdateLeadSourceDto,
} from './dto/lead-source.dto';
import {
  classifyLeadSource,
  deriveProvider,
  type LeadSourceRule,
} from './lead-source.util';

/** Lowercase, trim, drop blanks and duplicates. */
const clean = (list?: string[]) =>
  list === undefined
    ? undefined
    : [...new Set(list.map((s) => s.trim().toLowerCase()).filter(Boolean))];

/**
 * Admin-editable lead-source buckets and the rules that classify inquiries
 * into them. Rules are cached in memory (a handful of rows, read on every new
 * lead) and the cache is dropped on any change.
 */
@Injectable()
export class LeadSourcesService {
  private cache: LeadSourceRule[] | null = null;

  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.leadSource.findMany({
      orderBy: [{ priority: 'asc' }, { label: 'asc' }],
    });
  }

  /** Rules for the classifier (all rows; inactive ones are skipped there). */
  async rules(): Promise<LeadSourceRule[]> {
    this.cache ??= await this.prisma.leadSource.findMany();
    return this.cache;
  }

  async classify(input: { utmSource?: string | null; utmMedium?: string | null; referrer?: string | null }) {
    const { source, organic } = classifyLeadSource(input, await this.rules());
    return { source, organic, provider: deriveProvider(input) };
  }

  async create(dto: CreateLeadSourceDto) {
    const key = (dto.key ?? dto.label)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!key) throw new BadRequestException('Enter a name for the source');
    if (await this.prisma.leadSource.findUnique({ where: { key } })) {
      throw new ConflictException(`A source with key "${key}" already exists`);
    }
    const row = await this.prisma.leadSource.create({
      data: {
        key,
        label: dto.label.trim(),
        organic: dto.organic ?? true,
        hosts: clean(dto.hosts) ?? [],
        utmSources: clean(dto.utmSources) ?? [],
        utmMediums: clean(dto.utmMediums) ?? [],
        priority: dto.priority ?? 50,
        active: dto.active ?? true,
      },
    });
    this.cache = null;
    return row;
  }

  async update(key: string, dto: UpdateLeadSourceDto) {
    const existing = await this.prisma.leadSource.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException('Lead source not found');
    if (existing.system && dto.active === false) {
      throw new BadRequestException(`"${existing.label}" is a fallback source and cannot be turned off`);
    }
    const row = await this.prisma.leadSource.update({
      where: { key },
      data: {
        label: dto.label?.trim(),
        organic: dto.organic,
        hosts: clean(dto.hosts),
        utmSources: clean(dto.utmSources),
        utmMediums: clean(dto.utmMediums),
        priority: dto.priority,
        active: dto.active,
      },
    });
    this.cache = null;
    return row;
  }

  /**
   * Delete a source. Leads already classified into it keep the key; use
   * reclassify() to move them into whatever matches now.
   */
  async remove(key: string) {
    const existing = await this.prisma.leadSource.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException('Lead source not found');
    if (existing.system) {
      throw new BadRequestException(`"${existing.label}" is a fallback source and cannot be deleted`);
    }
    await this.prisma.leadSource.delete({ where: { key } });
    this.cache = null;
    const leads = await this.prisma.inquiry.count({ where: { source: key } });
    return { success: true, leadsStillTagged: leads };
  }

  /**
   * Re-run the current rules over every existing lead. Older leads predate the
   * raw utm_source column, so their stored provider stands in for it.
   */
  async reclassify() {
    const rules = await this.rules();
    const leads = await this.prisma.inquiry.findMany({
      select: {
        id: true,
        source: true,
        organic: true,
        provider: true,
        utmSource: true,
        medium: true,
        referrer: true,
      },
    });
    let changed = 0;
    for (const l of leads) {
      const input = {
        utmSource: l.utmSource || (l.referrer ? '' : l.provider),
        utmMedium: l.medium,
        referrer: l.referrer,
      };
      const { source, organic } = classifyLeadSource(input, rules);
      const provider = deriveProvider(input) || l.provider;
      if (source !== l.source || organic !== l.organic || provider !== l.provider) {
        await this.prisma.inquiry.update({
          where: { id: l.id },
          data: { source, organic, provider },
        });
        changed++;
      }
    }
    return { total: leads.length, changed };
  }
}
