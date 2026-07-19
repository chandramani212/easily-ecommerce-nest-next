import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateSourceDto,
  CronPreviewDto,
  SourceListQuery,
  SourceProductsQuery,
  TestConnectionDto,
  UpdateSourceDto,
} from './dto/source.dto';
import { UpsertManualSupplierDto } from './dto/supplier.dto';
import { SyncSchedulerService } from './runner/sync-scheduler.service';
import { SourcesService } from './sources.service';
import { SuppliersService } from './suppliers.service';

@ApiTags('sources')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('sources')
export class SourcesController {
  constructor(
    private readonly sources: SourcesService,
    private readonly scheduler: SyncSchedulerService,
    private readonly suppliers: SuppliersService,
  ) {}

  // Broadened to ADMIN so the "Source Categories" page (Products menu) can
  // populate its source picker. Source management stays SUPER_ADMIN-only.
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(@Query() query: SourceListQuery) {
    return this.sources.findAll(query);
  }

  /** The single manual supplier (contact details) for a direct source. */
  @Get(':id/supplier')
  getManualSupplier(@Param('id') id: string) {
    return this.suppliers.getManualForSource(id);
  }

  /** Create-or-update this source's manual supplier contact details. */
  @Put(':id/supplier')
  @Roles(UserRole.SUPER_ADMIN)
  upsertManualSupplier(
    @Param('id') id: string,
    @Body() dto: UpsertManualSupplierDto,
  ) {
    return this.suppliers.upsertManualForSource(id, dto);
  }

  @Get('cron-preview')
  cronPreview(@Query() q: CronPreviewDto) {
    const next = this.scheduler.preview(q.expression, q.count ?? 3);
    return { valid: next !== null, next: next ?? [] };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sources.findOne(id);
  }

  @Get(':id/products')
  listProducts(
    @Param('id') id: string,
    @Query() query: SourceProductsQuery,
  ) {
    return this.sources.listProducts(id, query);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateSourceDto) {
    return this.sources.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSourceDto) {
    return this.sources.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.sources.remove(id);
  }

  @Post(':id/test-connection')
  @Roles(UserRole.SUPER_ADMIN)
  testConnection(@Param('id') id: string, @Body() dto: TestConnectionDto) {
    return this.sources.testConnection(id, dto);
  }
}
