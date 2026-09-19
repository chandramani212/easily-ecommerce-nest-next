import {
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsIn } from 'class-validator';
import type { Response } from 'express';

import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SEO_TARGETS, SeoService, type SeoTargetName } from './seo.service';

class GenerateDto {
  @IsIn([...SEO_TARGETS, 'all'])
  target!: SeoTargetName | 'all';
}

/** Generated files are rewritten nightly; let crawlers cache them briefly. */
const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
};

/**
 * Sitemaps, robots.txt and the Google Merchant feed. The public routes are
 * proxied by the storefront at /sitemap.xml, /sitemaps/*, /feeds/* and
 * /robots.txt; the rest drive the admin's "SEO & Feeds" page.
 */
@ApiTags('seo')
@Controller('seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  // ------------------------------------------------------------- public

  @Public()
  @Get('sitemap.xml')
  async sitemapIndex(@Res() res: Response) {
    await this.send(res, await this.seo.publicFile('index'));
  }

  @Public()
  @Get('sitemaps/:file')
  async sitemap(@Param('file') file: string, @Res() res: Response) {
    await this.send(res, await this.seo.publicFile('sitemap', file));
  }

  @Public()
  @Get('feeds/:file')
  async feed(@Param('file') file: string, @Res() res: Response) {
    await this.send(res, await this.seo.publicFile('feed', file));
  }

  @Public()
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  robots() {
    return this.seo.robots();
  }

  // -------------------------------------------------------------- admin

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('status')
  status() {
    return this.seo.status();
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('generate')
  generate(@Body() dto: GenerateDto) {
    return this.seo.generate(dto.target);
  }

  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('feed-preview')
  feedPreview(@Query('sku') sku = '') {
    if (!sku.trim()) throw new NotFoundException('Enter a SKU');
    return this.seo.feedPreview(sku);
  }

  private send(res: Response, path: string | null): Promise<void> {
    if (!path) {
      throw new NotFoundException(
        'Not generated yet — use "Regenerate" on the admin SEO & Feeds page.',
      );
    }
    return new Promise((resolve, reject) =>
      res.sendFile(path, { headers: XML_HEADERS }, (err) => (err ? reject(err) : resolve())),
    );
  }
}
