import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateSupplierDto,
  CronPreviewDto,
  SupplierListQuery,
  SupplierProductsQuery,
  TestConnectionDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';
import { SyncSchedulerService } from './runner/sync-scheduler.service';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliers: SuppliersService,
    private readonly scheduler: SyncSchedulerService,
  ) {}

  @Get()
  findAll(@Query() query: SupplierListQuery) {
    return this.suppliers.findAll(query);
  }

  @Get('cron-preview')
  cronPreview(@Query() q: CronPreviewDto) {
    const next = this.scheduler.preview(q.expression, q.count ?? 3);
    return { valid: next !== null, next: next ?? [] };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliers.findOne(id);
  }

  @Get(':id/products')
  listProducts(
    @Param('id') id: string,
    @Query() query: SupplierProductsQuery,
  ) {
    return this.suppliers.listProducts(id, query);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliers.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliers.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.suppliers.remove(id);
  }

  @Post(':id/test-connection')
  @Roles(UserRole.ADMIN)
  testConnection(@Param('id') id: string, @Body() dto: TestConnectionDto) {
    return this.suppliers.testConnection(id, dto);
  }
}
