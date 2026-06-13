import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdatePageDto } from './dto/page.dto';
import { PAGE_DEFAULTS, PAGE_SLUGS, PageSlug } from './page-defaults';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  private assertSlug(slug: string): asserts slug is PageSlug {
    if (!(PAGE_SLUGS as readonly string[]).includes(slug)) {
      throw new BadRequestException(
        `Unknown page "${slug}". Valid pages: ${PAGE_SLUGS.join(', ')}.`,
      );
    }
  }

  /** Lazily create a page row from its seed the first time it's requested. */
  private async ensure(slug: PageSlug) {
    const existing = await this.prisma.page.findUnique({ where: { slug } });
    if (existing) return existing;
    const seed = PAGE_DEFAULTS[slug];
    return this.prisma.page.create({
      data: {
        slug,
        title: seed.title,
        content: seed.content as Prisma.InputJsonValue,
        metaTitle: seed.metaTitle,
        metaDescription: seed.metaDescription,
        keywords: seed.keywords,
      },
    });
  }

  async get(slug: string) {
    this.assertSlug(slug);
    return this.ensure(slug);
  }

  /** All editable pages (seeding any that don't exist yet). For the admin list. */
  async list() {
    const items = await Promise.all(PAGE_SLUGS.map((s) => this.ensure(s)));
    return { items };
  }

  async update(slug: string, dto: UpdatePageDto) {
    this.assertSlug(slug);
    await this.ensure(slug);
    const data: Prisma.PageUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined)
      data.content = dto.content as Prisma.InputJsonValue;
    if (dto.metaTitle !== undefined) data.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined)
      data.metaDescription = dto.metaDescription;
    if (dto.ogImage !== undefined) data.ogImage = dto.ogImage || null;
    if (dto.keywords !== undefined) data.keywords = dto.keywords;
    if (dto.canonicalUrl !== undefined) data.canonicalUrl = dto.canonicalUrl;

    return this.prisma.page.update({ where: { slug }, data });
  }
}
