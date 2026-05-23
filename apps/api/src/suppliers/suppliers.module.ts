import { Module } from '@nestjs/common';

import { MediaModule } from '../media/media.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MapperService } from './runner/mapper.service';
import { ImportRunnerService } from './runner/import-runner.service';
import { SyncSchedulerService } from './runner/sync-scheduler.service';
import { SecretsCipher } from './runner/encryption.util';
import { SupplierImportsController } from './supplier-imports.controller';
import { SupplierImportsService } from './supplier-imports.service';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [SuppliersController, SupplierImportsController],
  providers: [
    SuppliersService,
    SupplierImportsService,
    MapperService,
    ImportRunnerService,
    SyncSchedulerService,
    SecretsCipher,
  ],
  exports: [SuppliersService, SupplierImportsService],
})
export class SuppliersModule {}
