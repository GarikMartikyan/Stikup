import { Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthCleanupService } from '../auth-cleanup.service';

function buildPrismaMock() {
  return {
    loginToken: {
      create: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    channelIdentity: { findUnique: jest.fn(), update: jest.fn() },
    user: { create: jest.fn() },
    $queryRaw: jest.fn(),
  } as unknown as jest.Mocked<PrismaService>;
}

describe('AuthCleanupService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
      // suppress noise
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('purgeExpiredLoginTokens deletes expired-or-consumed login tokens', async () => {
    const prisma = buildPrismaMock();
    const service = new AuthCleanupService(prisma);

    const before = Date.now();
    await service.purgeExpiredLoginTokens();
    const after = Date.now();

    expect(prisma.loginToken.deleteMany).toHaveBeenCalledTimes(1);
    const arg = (prisma.loginToken.deleteMany as jest.Mock).mock.calls[0][0];
    expect(arg.where.OR).toHaveLength(2);

    const expiredClause = arg.where.OR.find(
      (c: Record<string, unknown>) => 'expiresAt' in c,
    );
    const consumedClause = arg.where.OR.find(
      (c: Record<string, unknown>) => 'consumedAt' in c,
    );

    expect(expiredClause).toBeDefined();
    expect(consumedClause).toEqual({ consumedAt: { not: null } });

    const now = (expiredClause.expiresAt as { lt: Date }).lt;
    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before - 5);
    expect(now.getTime()).toBeLessThanOrEqual(after + 5);
  });

  it('purgeExpiredSessions deletes expired-or-revoked sessions', async () => {
    const prisma = buildPrismaMock();
    const service = new AuthCleanupService(prisma);

    const before = Date.now();
    await service.purgeExpiredSessions();
    const after = Date.now();

    expect(prisma.session.deleteMany).toHaveBeenCalledTimes(1);
    const arg = (prisma.session.deleteMany as jest.Mock).mock.calls[0][0];
    expect(arg.where.OR).toHaveLength(2);

    const expiredClause = arg.where.OR.find(
      (c: Record<string, unknown>) => 'expiresAt' in c,
    );
    const revokedClause = arg.where.OR.find(
      (c: Record<string, unknown>) => 'revokedAt' in c,
    );

    expect(expiredClause).toBeDefined();
    expect(revokedClause).toEqual({ revokedAt: { not: null } });

    const now = (expiredClause.expiresAt as { lt: Date }).lt;
    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before - 5);
    expect(now.getTime()).toBeLessThanOrEqual(after + 5);
  });
});
