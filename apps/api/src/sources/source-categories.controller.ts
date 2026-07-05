import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  SourceCategoriesService,
  SourceCategoryListQuery,
} from './source-categories.service';

class SourceCategoryListQueryDto implements SourceCategoryListQuery {
  @IsOptional() @IsIn(['mapped', 'unmapped'])
  filter?: 'mapped' | 'unmapped';

  @IsOptional() @IsString()
  search?: string;

  @IsOptional()
  take?: number;

  @IsOptional()
  skip?: number;
}

class SetSourceCategoryMappingDto {
  /** Set to null/empty string to clear the mapping. */
  @IsOptional() @IsString()
  categoryId?: string | null;
}

@ApiTags('source-categories')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('sources/:sourceId/source-categories')
export class SourceCategoriesController {
  constructor(private readonly service: SourceCategoriesService) {}

  @Get()
  list(
    @Param('sourceId') sourceId: string,
    @Query() query: SourceCategoryListQueryDto,
  ) {
    return this.service.list(sourceId, query);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  setMapping(
    @Param('sourceId') sourceId: string,
    @Param('id') id: string,
    @Body() dto: SetSourceCategoryMappingDto,
  ) {
    const categoryId =
      dto.categoryId === undefined || dto.categoryId === '' ? null : dto.categoryId;
    return this.service.setMapping(sourceId, id, categoryId);
  }
}
