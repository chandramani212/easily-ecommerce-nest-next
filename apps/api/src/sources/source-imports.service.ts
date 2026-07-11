import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SourceImport, SourceImportFormat } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateImportDto,
  RunNowOptionsDto,
  RunsListQuery,
  UpdateImportDto,
} from './dto/source.dto';
import { buildAuthAdapter } from './runner/auth';
import { SecretsCipher } from './runner/encryption.util';
import { AsiCentralFetcher } from './runner/fetchers/asi-central.fetcher';
import { RestFetcher } from './runner/fetchers/rest.fetcher';
import { ImportRunnerService } from './runner/import-runner.service';
import { listPaths } from './runner/path.util';
import { parserFor } from './runner/parsers/parser';
import { SyncSchedulerService } from './runner/sync-scheduler.service';

@Injectable()
export class SourceImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: ImportRunnerService,
    private readonly scheduler: SyncSchedulerService,
    private readonly cipher: SecretsCipher,
  ) {}

  async list(sourceId: string) {
    return this.prisma.sourceImport.findMany({
      where: { sourceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(sourceId: string, id: string) {
    const imp = await this.prisma.sourceImport.findFirst({
      where: { id, sourceId },
    });
    if (!imp) throw new NotFoundException(`Import ${id} not found`);
    return imp;
  }

  async create(sourceId: string, dto: CreateImportDto) {
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
      select: { id: true },
    });
    if (!source) throw new NotFoundException(`Source ${sourceId} not found`);

    const created = await this.prisma.sourceImport.create({
      data: this.toPersistData(sourceId, dto, true),
    });
    await this.scheduler.refreshOne(created.id);
    return created;
  }

  async update(sourceId: string, id: string, dto: UpdateImportDto) {
    await this.findOne(sourceId, id); // 404 if missing
    const updated = await this.prisma.sourceImport.update({
      where: { id },
      data: this.toPersistData(sourceId, dto, false),
    });
    await this.scheduler.refreshOne(id);
    return updated;
  }

  async remove(sourceId: string, id: string) {
    await this.findOne(sourceId, id);
    await this.prisma.sourceImport.delete({ where: { id } });
    this.scheduler.unregister(id);
    return { id };
  }

  async runNow(
    sourceId: string,
    id: string,
    opts: RunNowOptionsDto,
    sample?: { body: Buffer; contentType?: string },
  ) {
    await this.findOne(sourceId, id);
    return this.runner.run(id, {
      trigger: 'MANUAL',
      limit: opts.limit,
      sample,
      supplierExternalIds: opts.supplierExternalIds,
    });
  }

  async dryRun(
    sourceId: string,
    id: string,
    sample?: { body: Buffer; contentType?: string },
    limit = 25,
  ) {
    await this.findOne(sourceId, id);
    return this.runner.run(id, { dryRun: true, limit, sample });
  }

  /** Fetch and parse a sample without applying any mapping. Powers the wizard. */
  async sample(
    sourceId: string,
    id: string,
    upload?: { body: Buffer; contentType?: string },
  ) {
    const imp = await this.findOne(sourceId, id);
    const source = await this.prisma.source.findUnique({
      where: { id: imp.sourceId },
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
    const isAsi = source?.kind === 'ASI_CENTRAL' && !upload;
    const format: SourceImportFormat = isAsi
      ? 'JSON'
      : (imp.format as SourceImportFormat);
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

  async listRuns(sourceId: string, id: string, query: RunsListQuery) {
    await this.findOne(sourceId, id);
    const take = Math.min(Math.max(1, query.take ?? 25), 100);
    const skip = Math.max(0, query.skip ?? 0);
    const [items, total] = await Promise.all([
      this.prisma.sourceImportRun.findMany({
        where: { importId: id },
        orderBy: { startedAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.sourceImportRun.count({ where: { importId: id } }),
    ]);
    return { total, items };
  }

  async getRun(sourceId: string, importId: string, runId: string) {
    await this.findOne(sourceId, importId);
    const run = await this.prisma.sourceImportRun.findFirst({
      where: { id: runId, importId },
    });
    if (!run) throw new NotFoundException(`Run ${runId} not found`);
    return run;
  }

  /* ---- Internals. ------------------------------------------------------ */

  private async fetchSample(
    imp: SourceImport,
  ): Promise<{ body: Buffer; contentType?: string }> {
    const source = await this.prisma.source.findUnique({
      where: { id: imp.sourceId },
    });
    if (!source) throw new NotFoundException('Source missing');
    if (source.kind === 'FILE_FEED') {
      throw new BadRequestException(
        'FILE_FEED imports require a file upload to sample.',
      );
    }
    const credentials = source.authSecret
      ? this.cipher.tryDecryptJson(source.authSecret)
      : null;
    const auth = buildAuthAdapter(source.authType, credentials ?? {});

    // ASI Central needs the two-step search→detail walk to produce a real
    // detail record; otherwise the mapping wizard only sees search-summary
    // fields. Cap pages/records so the wizard responds quickly.
    if (source.kind === 'ASI_CENTRAL') {
      const fetcher = new AsiCentralFetcher(
        {
          baseUrl: source.baseUrl,
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
        baseUrl: source.baseUrl,
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
    sourceId: string,
    dto: CreateImportDto | UpdateImportDto,
    isCreate: boolean,
  ): Prisma.SourceImportUncheckedCreateInput &
    Prisma.SourceImportUncheckedUpdateInput {
    const out: Prisma.SourceImportUncheckedCreateInput = {
      sourceId,
      name: dto.name ?? '',
      format: (dto.format ?? 'JSON') as SourceImportFormat,
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
    return out as unknown as Prisma.SourceImportUncheckedCreateInput &
      Prisma.SourceImportUncheckedUpdateInput;
  }
}
