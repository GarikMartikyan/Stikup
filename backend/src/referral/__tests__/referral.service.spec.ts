import { Prisma } from '@prisma/client';

import type { BotSender } from '../../auth/channel/bot-sender';
import { PrismaService } from '../../prisma/prisma.service';
import { ReferralService } from '../referral.service';

function buildPrismaMock() {
  return {
    user: {
      findUniqueOrThrow: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    referral: {
      create: jest.fn(),
      count: jest.fn(),
    },
    channelIdentity: {
      findFirst: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

function buildBotSenderMock(): jest.Mocked<BotSender> {
  return {
    channel: 'telegram' as const,
    sendSticker: jest.fn(),
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

const FRONTEND_STUB = { publicAppUrl: 'https://app.example.com' };

function buildService(
  prisma: jest.Mocked<PrismaService>,
  botSender: jest.Mocked<BotSender>,
) {
  const service = new ReferralService(
    prisma,
    OFFER_STUB,
    FRONTEND_STUB as never,
    botSender,
  );
  return service;
}

describe('ReferralService', () => {
  describe('attribute', () => {
    it('returns early when code is null', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      await service.attribute('user-a', null, 'email');

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns early when code is undefined', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      await service.attribute('user-a', undefined, 'email');

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns early when referrer is not found', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await service.attribute('user-a', 'BADCODE', 'email');

      expect(prisma.referral.create).not.toHaveBeenCalled();
    });

    it('ignores self-referral', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'self-user',
        fullPackUnlockedAt: null,
      });

      await service.attribute('self-user', 'SELFCODE', 'email');

      expect(prisma.referral.create).not.toHaveBeenCalled();
    });

    it('creates referral and unlocks referrer pack when unlockEnabled and not yet unlocked', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
        fullPackUnlockedAt: null,
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '12345',
      });

      await service.attribute('new-user-id', 'REFCODE', 'email');

      expect(prisma.referral.create).toHaveBeenCalledWith({
        data: {
          referrerId: 'referrer-id',
          referredUserId: 'new-user-id',
          channel: 'email',
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'referrer-id' },
        data: { fullPackUnlockedAt: expect.any(Date) },
      });
      // sendMessage is called asynchronously (best-effort), give it a tick
      await new Promise((r) => setTimeout(r, 0));
      expect(bot.sendMessage).toHaveBeenCalledWith(
        '12345',
        expect.stringContaining('unlocked'),
      );
    });

    it('does not send notification when referrer has no telegram identity', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
        fullPackUnlockedAt: null,
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await service.attribute('new-user-id', 'REFCODE', 'email');

      await new Promise((r) => setTimeout(r, 0));
      expect(bot.sendMessage).not.toHaveBeenCalled();
    });

    it('does not update fullPackUnlockedAt if already unlocked', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
        fullPackUnlockedAt: new Date(),
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});

      await service.attribute('new-user-id', 'REFCODE', 'email');

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('silently ignores duplicate attribution (P2002)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
        fullPackUnlockedAt: null,
      });

      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: {} },
      );
      (prisma.referral.create as jest.Mock).mockRejectedValueOnce(p2002);

      // Should not throw
      await expect(
        service.attribute('new-user-id', 'REFCODE', 'email'),
      ).resolves.toBeUndefined();

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('does not throw on unexpected errors (best-effort)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(
        service.attribute('new-user-id', 'REFCODE', 'email'),
      ).resolves.toBeUndefined();
    });
  });
});
