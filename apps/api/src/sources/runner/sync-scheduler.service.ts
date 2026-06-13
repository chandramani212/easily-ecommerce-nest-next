import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CronExpressionParser } from 'cron-parser';

import { PrismaService } from '../../prisma/prisma.service';
import { ImportRunnerService } from './import-runner.service';

const PREFIX = 'source-import:';

/**
 * Owns the lifecycle of CronJobs for SourceImports. Re-syncs after writes,
 * boots from DB on app startup, and skips imports that are inactive, lack a
 * cron expression, or whose source is FILE_FEED (manual-only).
 *
 * Validation uses cron-parser; @nestjs/schedule itself does not validate
 * expressions when registering, so silent typos would otherwise stay broken.
 */
@Injectable()
export class SyncSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: SchedulerRegistry,
    private readonly runner: ImportRunnerService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.refreshAll();
  }

  onModuleDestroy(): void {
    for (const name of [...this.registry.getCronJobs().keys()]) {
      if (name.startsWith(PREFIX)) {
        try {
          this.registry.deleteCronJob(name);
        } catch {
          // ignore — job may already be gone
        }
      }
    }
  }

  /** Refresh a single import's cron registration. Call after create/update/delete. */
  async refreshOne(importId: string): Promise<void> {
    this.unregister(importId);
    const imp = await this.prisma.sourceImport.findUnique({
      where: { id: importId },
      include: { source: true },
    });
    if (!imp) return;
    if (!imp.active || !imp.cron) return;
    if (imp.source.kind === 'FILE_FEED') return;
    if (!imp.source.active) return;
    this.register(importId, imp.cron);
  }

  /** Re-build the schedule from scratch. Used at boot. */
  async refreshAll(): Promise<void> {
    for (const name of [...this.registry.getCronJobs().keys()]) {
      if (name.startsWith(PREFIX)) {
        try {
          this.registry.deleteCronJob(name);
        } catch {
          // ignore
        }
      }
    }
    const imports = await this.prisma.sourceImport.findMany({
      where: { active: true, cron: { not: '' } },
      include: { source: true },
    });
    for (const imp of imports) {
      if (!imp.source.active || imp.source.kind === 'FILE_FEED') continue;
      this.register(imp.id, imp.cron);
    }
    this.logger.log(`Registered ${imports.length} source-import cron jobs`);
  }

  unregister(importId: string): void {
    const name = PREFIX + importId;
    if (this.registry.doesExist('cron', name)) {
      try {
        this.registry.deleteCronJob(name);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Validate an arbitrary cron expression. Returns the next 3 firing times
   * for the UI, or `null` if invalid.
   */
  preview(cron: string, count = 3): Date[] | null {
    if (!cron.trim()) return [];
    try {
      const it = CronExpressionParser.parse(cron);
      const out: Date[] = [];
      for (let i = 0; i < count; i += 1) out.push(it.next().toDate());
      return out;
    } catch {
      return null;
    }
  }

  private register(importId: string, cron: string): void {
    if (!this.preview(cron, 1)) {
      this.logger.warn(
        `Skipping cron registration for import ${importId}: invalid expression "${cron}"`,
      );
      return;
    }
    const name = PREFIX + importId;
    const job = new CronJob(cron, () => {
      void this.runner
        .run(importId, { trigger: 'SCHEDULE' })
        .catch((err: unknown) => {
          this.logger.error(
            `Scheduled import ${importId} failed: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        });
    });
    this.registry.addCronJob(name, job as unknown as CronJob);
    job.start();
  }
}
