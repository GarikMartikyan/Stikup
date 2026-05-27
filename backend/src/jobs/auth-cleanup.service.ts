import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthCleanupService {
  private readonly logger = new Logger(AuthCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredLoginTokens(): Promise<void> {
    const now = new Date();
    const result = await this.prisma.loginToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { consumedAt: { not: null } }],
      },
    });
    this.logger.log(`purged ${result.count} expired/consumed login tokens`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredSessions(): Promise<void> {
    const now = new Date();
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }],
      },
    });
    this.logger.log(`purged ${result.count} expired/revoked sessions`);
  }
}
