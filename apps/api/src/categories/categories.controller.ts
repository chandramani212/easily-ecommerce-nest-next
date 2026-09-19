import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { CategoriesService } from './categories.service';
import {
  CategoryProductsDto,
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  findAll(@Query('active') active?: string) {
    // `?active=true` restricts to active categories (storefront); admin omits it.
    return this.categories.findAll(active === 'true');
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categories.findOne(id);
  }

  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  // Must be declared before the `:id` route so "reorder" isn't captured as an id.
  @ApiBearerAuth()
  @Patch('reorder')
  reorder(@Body() dto: ReorderCategoriesDto) {
    return this.categories.reorder(dto.ids);
  }

  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @ApiBearerAuth()
  @Post(':id/products')
  addProducts(@Param('id') id: string, @Body() dto: CategoryProductsDto) {
    return this.categories.addProducts(id, dto.productIds);
  }

  @ApiBearerAuth()
  @Delete(':id/products/:productId')
  removeProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.categories.removeProduct(id, productId);
  }

  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}
