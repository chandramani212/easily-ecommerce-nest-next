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
} from './dto/source.dto';
import { SourceImportsService } from './source-imports.service';

function uploadToSample(file?: Express.Multer.File): {
  body: Buffer;
  contentType?: string;
} | undefined {
  return file?.buffer
    ? { body: file.buffer, contentType: file.mimetype }
    : undefined;
}

@ApiTags('source-imports')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@Controller('sources/:sourceId/imports')
export class SourceImportsController {
  constructor(private readonly imports: SourceImportsService) {}

  @Get()
  list(@Param('sourceId') sourceId: string) {
    return this.imports.list(sourceId);
  }

  @Get(':id')
  findOne(
    @Param('sourceId') sourceId: string,
    @Param('id') id: string,
  ) {
    return this.imports.findOne(sourceId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Param('sourceId') sourceId: string,
    @Body() dto: CreateImportDto,
  ) {
    return this.imports.create(sourceId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('sourceId') sourceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateImportDto,
  ) {
    return this.imports.update(sourceId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('sourceId') sourceId: string,
    @Param('id') id: string,
  ) {
    return this.imports.remove(sourceId, id);
  }

  @Post(':id/run')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  runNow(
    @Param('sourceId') sourceId: string,
    @Param('id') id: string,
    @Body() dto: RunNowOptionsDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.imports.runNow(sourceId, id, dto, uploadToSample(file));
  }

  @Post(':id/dry-run')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  dryRun(
    @Param('sourceId') sourceId: string,
    @Param('id') id: string,
    @Body() dto: DryRunOptionsDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.imports.dryRun(
      sourceId,
      id,
      uploadToSample(file),
      dto.limit ?? 25,
    );
  }

  @Post(':id/sample')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  sample(
    @Param('sourceId') sourceId: string,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.imports.sample(sourceId, id, uploadToSample(file));
  }

  @Get(':id/runs')
  runs(
    @Param('sourceId') sourceId: string,
    @Param('id') id: string,
    @Query() query: RunsListQuery,
  ) {
    return this.imports.listRuns(sourceId, id, query);
  }

  @Get(':id/runs/:runId')
  run(
    @Param('sourceId') sourceId: string,
    @Param('id') id: string,
    @Param('runId') runId: string,
  ) {
    return this.imports.getRun(sourceId, id, runId);
  }
}
