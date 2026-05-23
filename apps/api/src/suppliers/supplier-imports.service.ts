import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SupplierImport, SupplierImportFormat } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateImportDto,
  RunNowOptionsDto,
  RunsListQuery,
  UpdateImportDto,
} from './dto/supplier.dto';
import { buildAuthAdapter } from './runner/auth';
import { SecretsCipher } from './runner/encryption.util';
import { AsiCentralFetcher } from './runner/fetchers/asi-central.fetcher';
import { RestFetcher } from './runner/fetchers/rest.fetcher';
import { ImportRunnerService } from './runner/import-runner.service';
import { listPaths } from './runner/path.util';
import { parserFor } from './runner/parsers/parser';
import { SyncSchedulerService } from './runner/sync-scheduler.service';

@Injectable()
export class SupplierImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: ImportRunnerService,
    private readonly scheduler: SyncSchedulerService,
    private readonly cipher: SecretsCipher,
  ) {}

  async list(supplierId: string) {
    return this.prisma.supplierImport.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(supplierId: string, id: string) {
    const imp = await this.prisma.supplierImport.findFirst({
      where: { id, supplierId },
    });
    if (!imp) throw new NotFoundException(`Import ${id} not found`);
    return imp;
  }

  async create(supplierId: string, dto: CreateImportDto) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);

    const created = await this.prisma.supplierImport.create({
      data: this.toPersistData(supplierId, dto, true),
    });
    await this.scheduler.refreshOne(created.id);
    return created;
  }

  async update(supplierId: string, id: string, dto: UpdateImportDto) {
    await this.findOne(supplierId, id); // 404 if missing
    const updated = await this.prisma.supplierImport.update({
      where: { id },
      data: this.toPersistData(supplierId, dto, false),
    });
    await this.scheduler.refreshOne(id);
    return updated;
  }

  async remove(supplierId: string, id: string) {
    await this.findOne(supplierId, id);
    await this.prisma.supplierImport.delete({ where: { id } });
    this.scheduler.unregister(id);
    return { id };
  }

  async runNow(
    supplierId: string,
    id: string,
    opts: RunNowOptionsDto,
    sample?: { body: Buffer; contentType?: string },
  ) {
    await this.findOne(supplierId, id);
    return this.runner.run(id, {
      trigger: 'MANUAL',
      limit: opts.limit,
      sample,
    });
  }

  async dryRun(
    supplierId: string,
    id: string,
    sample?: { body: Buffer; contentType?: string },
    limit = 25,
  ) {
    await this.findOne(supplierId, id);
    return this.runner.run(id, { dryRun: true, limit, sample });
  }

  /** Fetch and parse a sample without applying any mapping. Powers the wizard. */
  async sample(
    supplierId: string,
    id: string,
    upload?: { body: Buffer; contentType?: string },
  ) {
    const imp = await this.findOne(supplierId, id);
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: imp.supplierId },
      select: { kind: true },
    });
    let body: Buffer;
    let contentType: string | undefined;
    if (upload) {
      body = upload.body;
      contentType = upload.contentType;
    } else {
      const result = await this.fetchSample(imp);
      body = result.body;
      contentType = result.contentType;
    }
    // ASI Central returns a synthetic `{ records: [<detail>, ...] }` envelope
    // from the fetcher itself; pin format/recordsPath to match what the runner
    // does (see ImportRunnerService.fetchAndParse). This is what lets the wizard
    // show real DETAIL paths instead of search-summary paths.
    const isAsi = supplier?.kind === 'ASI_CENTRAL' && !upload;
    const format: SupplierImportFormat = isAsi
      ? 'JSON'
      : (imp.format as SupplierImportFormat);
    const recordsPath = isAsi ? '$.records' : imp.recordsPath;
    const parser = parserFor(format);
    const parsed = parser.parse(body, recordsPath);
    const sampleRecord = parsed.records[0];
    const paths = sampleRecord ? listPaths(sampleRecord) : [];
    return {
      total: parsed.records.length,
      sampleRecord: sampleRecord ?? null,
      paths,
      contentType: contentType ?? null,
    };
  }

  async listRuns(supplierId: string, id: string, query: RunsListQuery) {
    await this.findOne(supplierId, id);
    const take = Math.min(Math.max(1, query.take ?? 25), 100);
    const skip = Math.max(0, query.skip ?? 0);
    const [items, total] = await Promise.all([
      this.prisma.supplierImportRun.findMany({
        where: { importId: id },
        orderBy: { startedAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.supplierImportRun.count({ where: { importId: id } }),
    ]);
    return { total, items };
  }

  async getRun(supplierId: string, importId: string, runId: string) {
    await this.findOne(supplierId, importId);
    const run = await this.prisma.supplierImportRun.findFirst({
      where: { id: runId, importId },
    });
    if (!run) throw new NotFoundException(`Run ${runId} not found`);
    return run;
  }

  /* ---- Internals. ------------------------------------------------------ */

  private async fetchSample(
    imp: SupplierImport,
  ): Promise<{ body: Buffer; contentType?: string }> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: imp.supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier missing');
    if (supplier.kind === 'FILE_FEED') {
      throw new BadRequestException(
        'FILE_FEED imports require a file upload to sample.',
      );
    }
    const credentials = supplier.authSecret
      ? this.cipher.tryDecryptJson(supplier.authSecret)
      : null;
    const auth = buildAuthAdapter(supplier.authType, credentials ?? {});

    // ASI Central needs the two-step search→detail walk to produce a real
    // detail record; otherwise the mapping wizard only sees search-summary
    // fields. Cap pages/records so the wizard responds quickly.
    if (supplier.kind === 'ASI_CENTRAL') {
      const fetcher = new AsiCentralFetcher(
        {
          baseUrl: supplier.baseUrl,
          maxPages: 1,
          maxRecords: 1,
          timeoutMs: 30_000,
        },
        auth,
      );
      return fetcher.fetch();
    }

    if (!imp.endpoint) {
      throw new BadRequestException(
        'Endpoint-less imports require a file upload to sample.',
      );
    }
    const headers =
      imp.headers && typeof imp.headers === 'object'
        ? (imp.headers as Record<string, string>)
        : {};
    const fetcher = new RestFetcher(
      {
        baseUrl: supplier.baseUrl,
        endpoint: imp.endpoint,
        method: imp.httpMethod,
        headers,
        body: imp.body,
        timeoutMs: 30_000,
        maxBytes: 10 * 1024 * 1024,
      },
      auth,
    );
    return fetcher.fetch();
  }

  private toPersistData(
    supplierId: string,
    dto: CreateImportDto | UpdateImportDto,
    isCreate: boolean,
  ): Prisma.SupplierImportUncheckedCreateInput &
    Prisma.SupplierImportUncheckedUpdateInput {
    const out: Prisma.SupplierImportUncheckedCreateInput = {
      supplierId,
      name: dto.name ?? '',
      format: (dto.format ?? 'JSON') as SupplierImportFormat,
    };
    if (dto.endpoint !== undefined) out.endpoint = dto.endpoint;
    if (dto.httpMethod !== undefined) out.httpMethod = dto.httpMethod;
    if (dto.headers !== undefined)
      out.headers = dto.headers as unknown as Prisma.InputJsonValue;
    if (dto.body !== undefined) out.body = dto.body;
    if (dto.recordsPath !== undefined) out.recordsPath = dto.recordsPath;
    if (dto.mapping !== undefined)
      out.mapping = dto.mapping as unknown as Prisma.InputJsonValue;
    if (dto.markup !== undefined)
      out.markup = dto.markup as unknown as Prisma.InputJsonValue;
    if (dto.cron !== undefined) out.cron = dto.cron;
    if (dto.active !== undefined) out.active = dto.active;
    if (dto.autoDeactivateMissing !== undefined)
      out.autoDeactivateMissing = dto.autoDeactivateMissing;

    if (isCreate) {
      // sensible defaults for create when omitted
      out.recordsPath = out.recordsPath ?? '$';
    }
    return out as unknown as Prisma.SupplierImportUncheckedCreateInput &
      Prisma.SupplierImportUncheckedUpdateInput;
  }
}
