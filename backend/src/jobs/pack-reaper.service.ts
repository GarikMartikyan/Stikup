import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { storageConfig } from '../config/storage.config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Fails packs that have been stuck in `generating` for too long. A pack can be
 * stranded if the backend is restarted mid-job (e.g. on every deploy, since the
 * BullMQ worker runs in-process and jobs use attempts:1 with no stalled
 * recovery). Without this, such a pack polls "generating" forever on the
 * result page. Runs once on boot (to clear restart-stranded packs immediately)
 * and then periodically.
 */
@Injectable()
export class PackReaperService implements OnModuleInit {
  private readonly logger = new Logger(PackReaperService.name);

  // Well beyond the 120s subprocess timeout + any realistic queue wait.
  private static readonly STALE_MS = 15 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(storageConfig.KEY)
    private readonly storage: ConfigType<typeof storageConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reapStalePacks();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async reapStalePacks(): Promise<void> {
    const cutoff = new Date(Date.now() - PackReaperService.STALE_MS);

    const stale = await this.prisma.pack.findMany({
      where: { status: 'generating', createdAt: { lt: cutoff } },
      select: { id: true },
    });
    if (stale.length === 0) return;

    const ids = stale.map((p) => p.id);
    await this.prisma.pack.updateMany({
      where: { id: { in: ids } },
      data: { status: 'failed' },
    });

    // Best-effort: remove any partially-written pack dirs so they don't leak.
    for (const id of ids) {
      await rm(join(this.storage.stickerDir, id), {
        recursive: true,
        force: true,
      }).catch(() => {});
    }

    this.logger.warn(
      `reaped ${stale.length} stale 'generating' pack(s): ${ids.join(', ')}`,
    );
  }
}
