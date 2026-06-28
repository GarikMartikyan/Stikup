import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export interface UserStats {
  totalUsers: number;
  newToday: number;
  byChannel: {
    telegram: number;
    whatsapp: number;
    email: number;
    google: number;
  };
  packsByStatus: {
    ready: number;
    failed: number;
    generating: number;
  };
}

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats(): Promise<UserStats> {
    const d = new Date();
    const startOfTodayUtc = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );

    const [totalUsers, newToday, channelGroups, packGroups] = await Promise.all(
      [
        this.prisma.user.count(),
        this.prisma.user.count({
          where: { createdAt: { gte: startOfTodayUtc } },
        }),
        this.prisma.channelIdentity.groupBy({
          by: ['channel'],
          _count: { _all: true },
        }),
        this.prisma.pack.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
      ],
    );

    const byChannel = {
      telegram: 0,
      whatsapp: 0,
      email: 0,
      google: 0,
    };
    for (const row of channelGroups) {
      const ch = row.channel;
      if (ch in byChannel) {
        byChannel[ch] = row._count._all;
      }
    }

    const packsByStatus = {
      ready: 0,
      failed: 0,
      generating: 0,
    };
    for (const row of packGroups) {
      const st = row.status;
      if (st in packsByStatus) {
        packsByStatus[st] = row._count._all;
      }
    }

    return { totalUsers, newToday, byChannel, packsByStatus };
  }
}
