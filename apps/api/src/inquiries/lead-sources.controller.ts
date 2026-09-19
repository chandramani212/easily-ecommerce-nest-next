import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateLeadSourceDto, UpdateLeadSourceDto } from './dto/lead-source.dto';
import { LeadSourcesService } from './lead-sources.service';

/** Admin management of the lead-source buckets inquiries are sorted into. */
@ApiTags('inquiries')
@ApiBearerAuth()
@Controller('lead-sources')
export class LeadSourcesController {
  constructor(private readonly sources: LeadSourcesService) {}

  @Get()
  list() {
    return this.sources.list();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateLeadSourceDto) {
    return this.sources.create(dto);
  }

  /** Declared before `:key` so it isn't read as a key. */
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('reclassify')
  reclassify() {
    return this.sources.reclassify();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateLeadSourceDto) {
    return this.sources.update(key, dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.sources.remove(key);
  }
}
