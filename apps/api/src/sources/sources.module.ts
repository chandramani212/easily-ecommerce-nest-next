import { Module } from '@nestjs/common';

import { MediaModule } from '../media/media.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MapperService } from './runner/mapper.service';
import { ImportRunnerService } from './runner/import-runner.service';
import { SyncSchedulerService } from './runner/sync-scheduler.service';
import { SecretsCipher } from './runner/encryption.util';
import { CategoryBackfillController } from './category-backfill.controller';
import { CategoryBackfillService } from './category-backfill.service';
import { SourceCategoriesController } from './source-categories.controller';
import { SourceCategoriesService } from './source-categories.service';
import { SourceImportsController } from './source-imports.controller';
import { SourceImportsService } from './source-imports.service';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [
    SourcesController,
    SourceImportsController,
    SourceCategoriesController,
    CategoryBackfillController,
    SuppliersController,
  ],
  providers: [
    SourcesService,
    SourceImportsService,
    SourceCategoriesService,
    CategoryBackfillService,
    SuppliersService,
    MapperService,
    ImportRunnerService,
    SyncSchedulerService,
    SecretsCipher,
  ],
  exports: [SourcesService, SourceImportsService, SuppliersService],
})
export class SourcesModule {}
