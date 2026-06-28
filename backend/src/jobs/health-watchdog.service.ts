import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AdminAlertService } from '../admin/admin-alert.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthWatchdogService {
  private readonly logger = new Logger(HealthWatchdogService.name);

  private pgFailures = 0;
  private pgDown = false;

  // A hung connection must count as a failure rather than stall the check
  // forever — otherwise a hard DB hang would never advance the failure counter.
  private static readonly PING_TIMEOUT_MS = 5_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alert: AdminAlertService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async check(): Promise<void> {
    try {
      await this.pingPostgres();
      if (this.pgDown) {
        this.pgDown = false;
        this.pgFailures = 0;
        await this.alert.info('✅ Postgres recovered');
      } else {
        this.pgFailures = 0;
      }
    } catch (err) {
      this.pgFailures++;
      this.logger.warn(
        `Postgres health check failed (attempt ${this.pgFailures}): ${err instanceof Error ? err.message : String(err)}`,
      );
      if (this.pgFailures >= 3 && !this.pgDown) {
        this.pgDown = true;
        await this.alert.alert(
          'Postgres unreachable — 3 consecutive health checks failed',
          { dedupeKey: 'pg-down', cooldownMs: 30 * 60 * 1000 },
        );
      }
    }
  }

  /**
   * Ping Postgres with a hard timeout so a hung connection counts as a failure
   * instead of blocking the cron tick indefinitely.
   */
  private async pingPostgres(): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('health check timed out')),
        HealthWatchdogService.PING_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
