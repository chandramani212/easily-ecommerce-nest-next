import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateImportDto,
  DryRunOptionsDto,
  RunNowOptionsDto,
  RunsListQuery,
  UpdateImportDto,
} from './dto/supplier.dto';
import { SupplierImportsService } from './supplier-imports.service';

function uploadToSample(file?: Express.Multer.File): {
  body: Buffer;
  contentType?: string;
} | undefined {
  return file?.buffer
    ? { body: file.buffer, contentType: file.mimetype }
    : undefined;
}

@ApiTags('supplier-imports')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@Controller('suppliers/:supplierId/imports')
export class SupplierImportsController {
  constructor(private readonly imports: SupplierImportsService) {}

  @Get()
  list(@Param('supplierId') supplierId: string) {
    return this.imports.list(supplierId);
  }

  @Get(':id')
  findOne(
    @Param('supplierId') supplierId: string,
    @Param('id') id: string,
  ) {
    return this.imports.findOne(supplierId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Param('supplierId') supplierId: string,
    @Body() dto: CreateImportDto,
  ) {
    return this.imports.create(supplierId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('supplierId') supplierId: string,
    @Param('id') id: string,
    @Body() dto: UpdateImportDto,
  ) {
    return this.imports.update(supplierId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('supplierId') supplierId: string,
    @Param('id') id: string,
  ) {
    return this.imports.remove(supplierId, id);
  }

  @Post(':id/run')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  runNow(
    @Param('supplierId') supplierId: string,
    @Param('id') id: string,
    @Body() dto: RunNowOptionsDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.imports.runNow(supplierId, id, dto, uploadToSample(file));
  }

  @Post(':id/dry-run')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  dryRun(
    @Param('supplierId') supplierId: string,
    @Param('id') id: string,
    @Body() dto: DryRunOptionsDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.imports.dryRun(
      supplierId,
      id,
      uploadToSample(file),
      dto.limit ?? 25,
    );
  }

  @Post(':id/sample')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  sample(
    @Param('supplierId') supplierId: string,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.imports.sample(supplierId, id, uploadToSample(file));
  }

  @Get(':id/runs')
  runs(
    @Param('supplierId') supplierId: string,
    @Param('id') id: string,
    @Query() query: RunsListQuery,
  ) {
    return this.imports.listRuns(supplierId, id, query);
  }

  @Get(':id/runs/:runId')
  run(
    @Param('supplierId') supplierId: string,
    @Param('id') id: string,
    @Param('runId') runId: string,
  ) {
    return this.imports.getRun(supplierId, id, runId);
  }
}
