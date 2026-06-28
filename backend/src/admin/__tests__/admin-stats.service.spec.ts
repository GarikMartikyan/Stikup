import { Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AdminStatsService } from '../admin-stats.service';

function buildPrismaMock() {
  return {
    user: {
      count: jest.fn(),
    },
    channelIdentity: {
      groupBy: jest.fn(),
    },
    pack: {
      groupBy: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

describe('AdminStatsService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {
      // suppress noise
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns correct user stats with all channels represented', async () => {
    const prisma = buildPrismaMock();

    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(42) // totalUsers
      .mockResolvedValueOnce(5); // newToday

    (prisma.channelIdentity.groupBy as jest.Mock).mockResolvedValue([
      { channel: 'telegram', _count: { _all: 30 } },
      { channel: 'google', _count: { _all: 10 } },
      { channel: 'email', _count: { _all: 2 } },
    ]);

    (prisma.pack.groupBy as jest.Mock).mockResolvedValue([
      { status: 'ready', _count: { _all: 20 } },
      { status: 'failed', _count: { _all: 3 } },
    ]);

    const service = new AdminStatsService(prisma);
    const stats = await service.getUserStats();

    expect(stats.totalUsers).toBe(42);
    expect(stats.newToday).toBe(5);
    expect(stats.byChannel.telegram).toBe(30);
    expect(stats.byChannel.google).toBe(10);
    expect(stats.byChannel.email).toBe(2);
    // whatsapp not in groupBy result -> defaults to 0
    expect(stats.byChannel.whatsapp).toBe(0);
    expect(stats.packsByStatus.ready).toBe(20);
    expect(stats.packsByStatus.failed).toBe(3);
    // generating not in groupBy result -> defaults to 0
    expect(stats.packsByStatus.generating).toBe(0);
  });

  it('defaults all channels and pack statuses to 0 when groupBy returns empty', async () => {
    const prisma = buildPrismaMock();

    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    (prisma.channelIdentity.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.pack.groupBy as jest.Mock).mockResolvedValue([]);

    const service = new AdminStatsService(prisma);
    const stats = await service.getUserStats();

    expect(stats.byChannel).toEqual({
      telegram: 0,
      whatsapp: 0,
      email: 0,
      google: 0,
    });
    expect(stats.packsByStatus).toEqual({
      ready: 0,
      failed: 0,
      generating: 0,
    });
  });

  it('passes correct startOfTodayUtc to user.count where clause', async () => {
    const prisma = buildPrismaMock();

    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(1);

    (prisma.channelIdentity.groupBy as jest.Mock).mockResolvedValue([]);
    (prisma.pack.groupBy as jest.Mock).mockResolvedValue([]);

    const before = new Date();
    const startOfExpected = new Date(
      Date.UTC(
        before.getUTCFullYear(),
        before.getUTCMonth(),
        before.getUTCDate(),
      ),
    );

    const service = new AdminStatsService(prisma);
    await service.getUserStats();

    const calls = (prisma.user.count as jest.Mock).mock.calls;
    expect(calls).toHaveLength(2);
    // Second call has the where: { createdAt: { gte: ... } } clause
    const whereClause = calls[1][0];
    expect(whereClause).toBeDefined();
    const gteDate = whereClause.where.createdAt.gte as Date;
    expect(gteDate).toBeInstanceOf(Date);
    expect(gteDate.getTime()).toBe(startOfExpected.getTime());
  });
});
