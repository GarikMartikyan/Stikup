import { Prisma } from '@prisma/client';

import type { BotSender } from '../../auth/channel/bot-sender';
import { PrismaService } from '../../prisma/prisma.service';
import { PackService } from '../pack.service';

function buildPrismaMock() {
  const mock = {
    pack: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    sticker: {
      findMany: jest.fn(),
    },
    packClaim: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    channelIdentity: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  // Run the callback against the same mock (interactive transaction).
  mock.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (tx: typeof mock) => unknown)(mock);
    }
    return Promise.all(arg as Promise<unknown>[]);
  });
  return mock as unknown as jest.Mocked<PrismaService>;
}

function buildBotSenderMock(): jest.Mocked<BotSender> {
  return {
    channel: 'telegram' as const,
    sendSticker: jest.fn().mockResolvedValue(undefined),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    getBotUrl: jest.fn().mockResolvedValue('https://t.me/stikup_bot'),
  };
}

const OFFER_STUB = {
  packSize: 12,
  freeStickerCount: 3,
  referralUnlockEnabled: true,
  paidGenerations: 10,
  freeGenerations: 1,
  freeRegenerations: 1,
  priceLabel: '$5',
  priceAmountCents: 500,
  currency: 'USD',
};

function buildService(
  prisma: jest.Mocked<PrismaService>,
  bot: jest.Mocked<BotSender>,
) {
  return new PackService(bot, prisma, OFFER_STUB);
}

describe('PackService', () => {
  describe('generatePack', () => {
    it('creates a pack with packSize stickers in a transaction when under limit', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      // generationsUsed = 0 → under maxGenerations (2)
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
        { generations_used: 0 },
      ]);
      (prisma.pack.create as jest.Mock).mockResolvedValueOnce({ id: 'pack-1' });

      const result = await service.generatePack('user-abc');

      expect(result).toEqual({ packId: 'pack-1' });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      // generationsUsed must be incremented
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-abc' },
        data: { generationsUsed: { increment: 1 } },
      });
      expect(prisma.pack.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-abc',
          status: 'ready',
          stickers: {
            create: expect.arrayContaining([
              { index: 0, url: '/assets/sticker_1.webp' },
              { index: 11, url: '/assets/sticker_12.webp' },
            ]),
          },
        },
        select: { id: true },
      });
      // Verify exactly packSize stickers
      const createCall = (prisma.pack.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.stickers.create).toHaveLength(12);
    });

    it('throws ForbiddenException when generationsUsed >= maxGenerations', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      // generationsUsed = 2, maxGenerations = 1 + 1 = 2 → at limit
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
        { generations_used: 2 },
      ]);

      await expect(service.generatePack('user-abc')).rejects.toMatchObject({
        message: 'generation_limit_reached',
      });

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.pack.create).not.toHaveBeenCalled();
    });

    it('generates sequential sticker indices 0..11', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
        { generations_used: 0 },
      ]);
      (prisma.pack.create as jest.Mock).mockResolvedValueOnce({ id: 'pack-2' });

      await service.generatePack('user-xyz');

      const createCall = (prisma.pack.create as jest.Mock).mock.calls[0][0];
      const stickers: Array<{ index: number; url: string }> =
        createCall.data.stickers.create;
      for (let i = 0; i < 12; i++) {
        expect(stickers[i]).toEqual({
          index: i,
          url: `/assets/sticker_${i + 1}.webp`,
        });
      }
    });
  });

  describe('getPack', () => {
    it('returns null when pack belongs to a different user', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-x',
        status: 'ready',
        userId: 'other-user',
        stickers: [],
      });

      const result = await service.getPack('pack-x', 'user-abc');
      expect(result).toBeNull();
    });

    it('returns null when pack does not exist', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getPack('nonexistent', 'user-abc');
      expect(result).toBeNull();
    });

    it('returns pack detail with unlocked=false for locked user', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        status: 'ready',
        userId: 'user-abc',
        stickers: [{ index: 0, url: '/assets/sticker_1.webp' }],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        fullPackUnlockedAt: null,
        generationsUsed: 1,
      });

      const result = await service.getPack('pack-1', 'user-abc');
      expect(result).not.toBeNull();
      expect(result!.unlocked).toBe(false);
      expect(result!.freeCount).toBe(3);
      expect(result!.packSize).toBe(12);
    });

    it('returns pack detail with unlocked=true for unlocked user', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        status: 'ready',
        userId: 'user-abc',
        stickers: [],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        fullPackUnlockedAt: new Date(),
        generationsUsed: 1,
      });

      const result = await service.getPack('pack-1', 'user-abc');
      expect(result!.unlocked).toBe(true);
    });

    it('returns regensLeft=1 when generationsUsed=1 (maxGenerations=2)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        status: 'ready',
        userId: 'user-abc',
        stickers: [],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        fullPackUnlockedAt: null,
        generationsUsed: 1,
      });

      const result = await service.getPack('pack-1', 'user-abc');
      // maxGenerations = 1 + freeRegenerations(1) = 2; used=1 → left=1
      expect(result!.regensLeft).toBe(1);
    });

    it('returns regensLeft=0 when generationsUsed=2 (at limit)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        status: 'ready',
        userId: 'user-abc',
        stickers: [],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        fullPackUnlockedAt: null,
        generationsUsed: 2,
      });

      const result = await service.getPack('pack-1', 'user-abc');
      // maxGenerations = 2; used=2 → left=0 (clamped, never negative)
      expect(result!.regensLeft).toBe(0);
    });
  });

  describe('listPacks', () => {
    it('returns the user packs (most recent first) with unlock + counts', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'pack-2',
          status: 'ready',
          createdAt: new Date('2026-05-30T00:00:00.000Z'),
          stickers: [{ index: 0, url: '/assets/sticker_1.webp' }],
        },
      ]);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        fullPackUnlockedAt: null,
        generationsUsed: 1,
      });

      const result = await service.listPacks('user-abc');

      expect(prisma.pack.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-abc' },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toEqual([
        {
          id: 'pack-2',
          createdAt: '2026-05-30T00:00:00.000Z',
          status: 'ready',
          unlocked: false,
          freeCount: 3,
          packSize: 12,
          regensLeft: 1,
          stickers: [{ index: 0, url: '/assets/sticker_1.webp' }],
        },
      ]);
    });

    it('returns an empty array when the user has no packs', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        fullPackUnlockedAt: null,
      });

      const result = await service.listPacks('user-abc');
      expect(result).toEqual([]);
    });
  });

  describe('deletePack', () => {
    it('returns false when pack does not exist', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.deletePack('pack-x', 'user-abc');
      expect(result).toBe(false);
      expect(prisma.pack.delete).not.toHaveBeenCalled();
    });

    it('returns false when pack belongs to another user', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'other-user',
      });

      const result = await service.deletePack('pack-x', 'user-abc');
      expect(result).toBe(false);
      expect(prisma.pack.delete).not.toHaveBeenCalled();
    });

    it('deletes the pack and returns true for the owner', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-abc',
      });
      (prisma.pack.delete as jest.Mock).mockResolvedValueOnce({});

      const result = await service.deletePack('pack-1', 'user-abc');
      expect(result).toBe(true);
      expect(prisma.pack.delete).toHaveBeenCalledWith({
        where: { id: 'pack-1' },
      });
    });
  });

  describe('deliverTelegram', () => {
    it('rolls back the claim and returns delivered:false when sendSticker throws mid-loop', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      // ownership check passes
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-abc',
      });
      // telegram identity exists
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '99999',
      });
      // user is locked (free count = 3)
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        fullPackUnlockedAt: null,
      });
      // claim insert succeeds (this call owns it)
      (prisma.packClaim.create as jest.Mock).mockResolvedValueOnce({});
      // first sticker send throws
      (bot.sendSticker as jest.Mock).mockRejectedValueOnce(
        new Error('Telegram API timeout'),
      );
      // rollback delete succeeds
      (prisma.packClaim.delete as jest.Mock).mockResolvedValueOnce({});

      const result = await service.deliverTelegram('pack-1', 'user-abc');

      expect(result).toEqual({
        delivered: false,
        botUrl: 'https://t.me/stikup_bot',
      });
      // The claim that THIS call inserted must be deleted.
      expect(prisma.packClaim.delete).toHaveBeenCalledWith({
        where: { packId_userId: { packId: 'pack-1', userId: 'user-abc' } },
      });
    });

    it('does not delete a pre-existing claim when P2002 fires (alreadyClaimed)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-abc',
      });
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '99999',
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        fullPackUnlockedAt: null,
      });

      // Simulate the claim already existing (P2002).
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: {} },
      );
      (prisma.packClaim.create as jest.Mock).mockRejectedValueOnce(p2002);

      const result = await service.deliverTelegram('pack-1', 'user-abc');

      expect(result).toEqual({
        delivered: false,
        botUrl: 'https://t.me/stikup_bot',
        alreadyClaimed: true,
      });
      // Must NOT touch the pre-existing claim row.
      expect(prisma.packClaim.delete).not.toHaveBeenCalled();
      expect(bot.sendSticker).not.toHaveBeenCalled();
    });
  });

  describe('claimFreeStickers', () => {
    it('returns delivered:false when pack does not exist', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.claimFreeStickers(
        'missing-pack',
        'user-abc',
      );

      expect(result).toEqual({
        delivered: false,
        botUrl: 'https://t.me/stikup_bot',
      });
      expect(prisma.packClaim.create).not.toHaveBeenCalled();
    });

    it('returns delivered:false when pack belongs to a different user', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'other-user',
      });

      const result = await service.claimFreeStickers('pack-1', 'user-abc');

      expect(result).toEqual({
        delivered: false,
        botUrl: 'https://t.me/stikup_bot',
      });
      expect(prisma.packClaim.create).not.toHaveBeenCalled();
    });
  });
});
