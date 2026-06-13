import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdatePageDto } from './dto/page.dto';
import { PagesService } from './pages.service';

@ApiTags('pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  /** Admin: list every editable page. */
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get()
  list() {
    return this.pages.list();
  }

  /** Public: storefront reads page content + SEO. */
  @Public()
  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.pages.get(slug);
  }

  /** Admin: update page content + SEO. */
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdatePageDto) {
    return this.pages.update(slug, dto);
  }
}
