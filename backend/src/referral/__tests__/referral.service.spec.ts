import { Prisma } from '@prisma/client';

import type { BotSender } from '../../auth/channel/bot-sender';
import type { TelegramStickerService } from '../../auth/channel/telegram-sticker.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getPackStickerFiles } from '../../pack/sticker-assets';
import { ReferralService } from '../referral.service';

// Mock the sticker-assets helper so referral top-up resolves a dense list of
// real sticker paths without touching the real filesystem.
jest.mock('../../pack/sticker-assets', () => ({
  getPackStickerFiles: jest
    .fn()
    .mockReturnValue(['/tmp/stikup-test-packs/p/sticker_1.webp']),
}));

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
    pack: {
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
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

function buildStickerServiceMock(): jest.Mocked<TelegramStickerService> {
  return {
    buildSetName: jest.fn(),
    buildTitle: jest.fn(),
    shareUrl: jest.fn(),
    getBotUsername: jest.fn().mockResolvedValue('TestBot'),
    ensureSet: jest.fn().mockResolvedValue({
      name: 'pabcdef_by_testbot',
      shareUrl: 'https://t.me/addstickers/pabcdef_by_testbot',
      count: 12,
    }),
  } as unknown as jest.Mocked<TelegramStickerService>;
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
  stickerDefaultEmoji: '😀',
  unlimitedGenerations: false,
};

const FRONTEND_STUB = { publicAppUrl: 'https://app.example.com' };

function buildService(
  prisma: jest.Mocked<PrismaService>,
  botSender: jest.Mocked<BotSender>,
  stickerSvc?: jest.Mocked<TelegramStickerService>,
) {
  const service = new ReferralService(
    prisma,
    OFFER_STUB,
    FRONTEND_STUB as never,
    botSender,
    stickerSvc ?? buildStickerServiceMock(),
    { stickerDir: '/tmp/stikup-test-packs' },
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
        username: 'alice',
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

    it('tops up all eligible packs when referral unlocks the referrer', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
        fullPackUnlockedAt: null,
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '12345',
        username: 'alice',
      });
      // Two eligible packs
      (prisma.pack.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'pack-a', telegramStickerCount: 3 },
        { id: 'pack-b', telegramStickerCount: 6 },
      ]);

      await service.attribute('new-user-id', 'REFCODE', 'email');
      // Give best-effort fire-and-forget a tick to settle
      await new Promise((r) => setTimeout(r, 0));

      expect(stickerSvc.ensureSet).toHaveBeenCalledTimes(2);
      expect(prisma.pack.update).toHaveBeenCalledTimes(2);
      // Assert the persisted count is the result.count (12), not the stale value.
      expect(prisma.pack.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pack-a' },
          data: { telegramStickerCount: 12 },
        }),
      );
      expect(prisma.pack.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pack-b' },
          data: { telegramStickerCount: 12 },
        }),
      );
      // Assert ensureSet received the correct packIds and non-empty files.
      expect(stickerSvc.ensureSet).toHaveBeenCalledWith(
        expect.objectContaining({
          packId: 'pack-a',
          channelUserId: '12345',
          files: expect.arrayContaining([expect.any(String)]),
        }),
      );
      expect(stickerSvc.ensureSet).toHaveBeenCalledWith(
        expect.objectContaining({ packId: 'pack-b' }),
      );
      // Message should contain pack links
      expect(bot.sendMessage).toHaveBeenCalledWith(
        '12345',
        expect.stringContaining('t.me/addstickers'),
      );
    });

    it('skips top-up when referrer has no eligible packs (no set)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
        fullPackUnlockedAt: null,
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '12345',
        username: 'alice',
      });
      // No eligible packs
      (prisma.pack.findMany as jest.Mock).mockResolvedValueOnce([]);

      await service.attribute('new-user-id', 'REFCODE', 'email');
      await new Promise((r) => setTimeout(r, 0));

      expect(stickerSvc.ensureSet).not.toHaveBeenCalled();
      // Still sends the unlock notification (without links)
      expect(bot.sendMessage).toHaveBeenCalledTimes(1);
      expect(bot.sendMessage).toHaveBeenCalledWith(
        '12345',
        expect.stringContaining('unlocked'),
      );
    });

    it('does not break attribution when ensureSet throws for one pack', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
        fullPackUnlockedAt: null,
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '12345',
        username: 'alice',
      });
      (prisma.pack.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'pack-fail', telegramStickerCount: 3 },
      ]);
      (stickerSvc.ensureSet as jest.Mock).mockRejectedValueOnce(
        new Error('Telegram error'),
      );

      // Should not throw
      await expect(
        service.attribute('new-user-id', 'REFCODE', 'email'),
      ).resolves.toBeUndefined();
      await new Promise((r) => setTimeout(r, 0));
      // Still sends the notification
      expect(bot.sendMessage).toHaveBeenCalled();
    });

    it('skips top-up for a pack whose real stickers are unavailable', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
        fullPackUnlockedAt: null,
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '12345',
        username: 'alice',
      });
      (prisma.pack.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'pack-missing', telegramStickerCount: 3 },
      ]);
      // This pack's generated stickers are missing on disk → it must be skipped.
      jest.mocked(getPackStickerFiles).mockReturnValueOnce([]);

      await service.attribute('new-user-id', 'REFCODE', 'email');
      await new Promise((r) => setTimeout(r, 0));

      // The unavailable pack is skipped — no sticker set is built or updated.
      expect(stickerSvc.ensureSet).not.toHaveBeenCalled();
      expect(prisma.pack.update).not.toHaveBeenCalled();
      // The unlock notification is still sent (without pack links).
      expect(bot.sendMessage).toHaveBeenCalledWith(
        '12345',
        expect.stringContaining('unlocked'),
      );
    });
  });
});
