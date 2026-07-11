import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CategoryBackfillService } from './category-backfill.service';

@ApiTags('category-backfill')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('sources/:sourceId/categorize-products')
export class CategoryBackfillController {
  constructor(private readonly service: CategoryBackfillService) {}

  /** Start (or return the already-running) product → category backfill job. */
  @Post()
  start(@Param('sourceId') sourceId: string) {
    return this.service.start(sourceId);
  }

  /** Poll job progress. */
  @Get('status')
  status(@Param('sourceId') sourceId: string) {
    return this.service.getStatus(sourceId);
  }
}
