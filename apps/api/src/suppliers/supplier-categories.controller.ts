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
  SupplierCategoriesService,
  SupplierCategoryListQuery,
} from './supplier-categories.service';

class SupplierCategoryListQueryDto implements SupplierCategoryListQuery {
  @IsOptional() @IsIn(['mapped', 'unmapped'])
  filter?: 'mapped' | 'unmapped';

  @IsOptional() @IsString()
  search?: string;

  @IsOptional()
  take?: number;

  @IsOptional()
  skip?: number;
}

class SetSupplierCategoryMappingDto {
  /** Set to null/empty string to clear the mapping. */
  @IsOptional() @IsString()
  categoryId?: string | null;
}

@ApiTags('supplier-categories')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@Controller('suppliers/:supplierId/supplier-categories')
export class SupplierCategoriesController {
  constructor(private readonly service: SupplierCategoriesService) {}

  @Get()
  list(
    @Param('supplierId') supplierId: string,
    @Query() query: SupplierCategoryListQueryDto,
  ) {
    return this.service.list(supplierId, query);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  setMapping(
    @Param('supplierId') supplierId: string,
    @Param('id') id: string,
    @Body() dto: SetSupplierCategoryMappingDto,
  ) {
    const categoryId =
      dto.categoryId === undefined || dto.categoryId === '' ? null : dto.categoryId;
    return this.service.setMapping(supplierId, id, categoryId);
  }
}
