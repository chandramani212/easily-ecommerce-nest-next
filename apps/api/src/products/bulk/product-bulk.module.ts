import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { ProductBulkController } from './product-bulk.controller';
import { ProductBulkExportService } from './product-bulk-export.service';
import { ProductBulkImportService } from './product-bulk-import.service';
import { ProductExportService } from './product-export.service';
import { ProductImportService } from './product-import.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductBulkController],
  providers: [
    ProductBulkExportService,
    ProductBulkImportService,
    ProductExportService,
    ProductImportService,
  ],
})
export class ProductBulkModule {}
