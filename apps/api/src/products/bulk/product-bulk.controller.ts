import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentUser, type JwtUser } from '../../auth/decorators/current-user.decorator';
import { ProductBulkExportService } from './product-bulk-export.service';
import { ProductBulkImportService } from './product-bulk-import.service';
import { ALL_GROUP_KEYS, PRODUCT_FIELD_GROUPS } from './product-columns';
import { ProductExportService } from './product-export.service';
import { ProductImportService } from './product-import.service';

/** Refuse anything larger outright rather than trying to parse it. */
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

/**
 * Spreadsheet round-trip for the catalogue: export every product with its
 * category path, edit the sheet, import it back.
 *
 * These live alongside the legacy `/products/export` and `/products/import`,
 * which are left untouched. The legacy pair buffers the whole catalogue in
 * memory and updates row by row, so it cannot complete at this catalogue's
 * size; everything here streams or works in set-based batches.
 */
@ApiTags('products')
@ApiBearerAuth()
@Controller('products/bulk')
export class ProductBulkController {
  constructor(
    private readonly exporter: ProductBulkExportService,
    private readonly importer: ProductBulkImportService,
    private readonly productExporter: ProductExportService,
    private readonly productImporter: ProductImportService,
  ) {}

  // ------------------------------------------- full product sheet (all fields)

  /** Field groups the export can include — drives the admin's checkboxes. */
  @Get('fields')
  fields() {
    return PRODUCT_FIELD_GROUPS;
  }

  /**
   * Streamed CSV of every product. `fields` = comma-separated group keys
   * (default: all); `sample=1` writes only a few rows as a format template.
   */
  @Get('export')
  async export(
    @Res() res: Response,
    @Query('fields') fields?: string,
    @Query('sample') sample?: string,
  ): Promise<void> {
    const groups = fields
      ? fields.split(',').filter((f) => ALL_GROUP_KEYS.includes(f))
      : ALL_GROUP_KEYS;
    const isSample = sample === '1' || sample === 'true';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${isSample ? 'products-sample' : 'products'}.csv"`,
    );
    await this.productExporter.streamCsv(res, groups, isSample);
    res.end();
  }

  /**
   * Upload a full product sheet (any subset of the export columns, keyed on
   * sku). Validated in the background; nothing is written until applied.
   */
  @Post('import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async import(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtUser | undefined,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    if (file.size === 0) throw new BadRequestException('The file is empty.');
    return this.productImporter.createJob(
      file.originalname || 'upload.csv',
      file.buffer.toString('utf8'),
      user?.sub ?? null,
    );
  }

  @Get('import/:id')
  importStatus(@Param('id') id: string) {
    return this.importer.get(id);
  }

  @Post('import/:id/apply')
  importApply(@Param('id') id: string) {
    return this.productImporter.applyJob(id);
  }

  @Post('import/:id/cancel')
  importCancel(@Param('id') id: string) {
    return this.importer.cancelJob(id);
  }

  // ------------------------------------------------ category-only sheet (legacy)

  /** Streamed CSV of every product and its category path. */
  @Get('category-export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="product-categories.csv"')
  async categoryExport(@Res() res: Response): Promise<void> {
    await this.exporter.streamCsv(res);
    res.end();
  }

  /**
   * Upload a sheet. Returns a job id immediately — the rows are staged and
   * validated in the background, and NOTHING is written to the catalogue until
   * the job is explicitly applied.
   */
  @Post('category-import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async categoryImport(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtUser | undefined,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    if (file.size === 0) throw new BadRequestException('The file is empty.');

    return this.importer.createJob(
      file.originalname || 'upload.csv',
      file.buffer.toString('utf8'),
      user?.sub ?? null,
    );
  }

  /** Recent import jobs, newest first. */
  @Get('category-import')
  list(@Query('limit') limit?: string) {
    return this.importer.list(limit ? Number(limit) : undefined);
  }

  /** Poll target for the progress bar and the validation report. */
  @Get('category-import/:id')
  get(@Param('id') id: string) {
    return this.importer.get(id);
  }

  /** Confirm a validated job. This is the only call that writes. */
  @Post('category-import/:id/apply')
  apply(@Param('id') id: string) {
    return this.importer.applyJob(id);
  }

  @Post('category-import/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.importer.cancelJob(id);
  }
}
