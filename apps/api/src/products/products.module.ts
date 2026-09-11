import { Module } from '@nestjs/common';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsStorefrontService } from './storefront.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsStorefrontService],
  exports: [ProductsService],
})
export class ProductsModule {}
