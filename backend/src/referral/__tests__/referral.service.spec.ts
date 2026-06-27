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
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    pendingReferral: {
      upsert: jest.fn().mockResolvedValue({}),
      delete: jest.fn(),
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
  stickerDefaultEmoji: '😀',
};

function buildService(
  prisma: jest.Mocked<PrismaService>,
  botSender: jest.Mocked<BotSender>,
  stickerSvc?: jest.Mocked<TelegramStickerService>,
) {
  const service = new ReferralService(
    prisma,
    OFFER_STUB,
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
      });

      await service.attribute('self-user', 'SELFCODE', 'email');

      expect(prisma.referral.create).not.toHaveBeenCalled();
    });

    it('creates referral but unlocks nothing when packId is missing', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});

      await service.attribute('new-user-id', 'REFCODE', 'email');

      expect(prisma.referral.create).toHaveBeenCalledWith({
        data: {
          referrerId: 'referrer-id',
          referredUserId: 'new-user-id',
          channel: 'email',
        },
      });
      expect(prisma.pack.findUnique).not.toHaveBeenCalled();
      expect(prisma.pack.update).not.toHaveBeenCalled();
    });

    it('creates referral but unlocks nothing when packId is provided but pack not found', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await service.attribute(
        'new-user-id',
        'REFCODE',
        'email',
        'missing-pack',
      );

      expect(prisma.referral.create).toHaveBeenCalled();
      expect(prisma.pack.update).not.toHaveBeenCalled();
    });

    it('creates referral but unlocks nothing when pack belongs to a different user', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        userId: 'other-user',
        unlockedAt: null,
        telegramStickerSetName: null,
        telegramStickerCount: 0,
      });

      await service.attribute('new-user-id', 'REFCODE', 'email', 'pack-1');

      expect(prisma.referral.create).toHaveBeenCalled();
      // Pack belongs to other-user, not referrer — must not unlock
      expect(prisma.pack.update).not.toHaveBeenCalled();
    });

    it('creates referral and unlocks the specific pack when valid packId provided', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        userId: 'referrer-id',
        unlockedAt: null,
        telegramStickerSetName: null,
        telegramStickerCount: 0,
      });
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '12345',
        username: 'alice',
      });

      await service.attribute('new-user-id', 'REFCODE', 'email', 'pack-1');

      expect(prisma.referral.create).toHaveBeenCalledWith({
        data: {
          referrerId: 'referrer-id',
          referredUserId: 'new-user-id',
          channel: 'email',
        },
      });
      expect(prisma.pack.update).toHaveBeenCalledWith({
        where: { id: 'pack-1' },
        data: { unlockedAt: expect.any(Date) },
      });
      // sendMessage is called asynchronously (best-effort), give it a tick
      await new Promise((r) => setTimeout(r, 0));
      expect(bot.sendMessage).toHaveBeenCalledWith(
        '12345',
        expect.stringContaining('unlocked'),
      );
    });

    it('does not unlock pack when it is already unlocked (pack.unlockedAt != null)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        userId: 'referrer-id',
        unlockedAt: new Date(),
        telegramStickerSetName: null,
        telegramStickerCount: 12,
      });

      await service.attribute('new-user-id', 'REFCODE', 'email', 'pack-1');

      // Referral is still recorded
      expect(prisma.referral.create).toHaveBeenCalled();
      // Pack already unlocked — must not re-unlock
      expect(prisma.pack.update).not.toHaveBeenCalled();
      expect(bot.sendMessage).not.toHaveBeenCalled();
    });

    it('does not send notification when referrer has no telegram identity', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        userId: 'referrer-id',
        unlockedAt: null,
        telegramStickerSetName: null,
        telegramStickerCount: 0,
      });
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await service.attribute('new-user-id', 'REFCODE', 'email', 'pack-1');

      await new Promise((r) => setTimeout(r, 0));
      expect(bot.sendMessage).not.toHaveBeenCalled();
    });

    it('silently ignores duplicate attribution (P2002)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });

      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: {} },
      );
      (prisma.referral.create as jest.Mock).mockRejectedValueOnce(p2002);

      // Should not throw
      await expect(
        service.attribute('new-user-id', 'REFCODE', 'email', 'pack-1'),
      ).resolves.toBeUndefined();

      expect(prisma.pack.update).not.toHaveBeenCalled();
    });

    it('does not throw on unexpected errors (best-effort)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(
        service.attribute('new-user-id', 'REFCODE', 'email', 'pack-1'),
      ).resolves.toBeUndefined();
    });

    it('tops up the specific pack via Telegram when it has a partial set', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      // Pack has a partial Telegram set (3 of 12 stickers)
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-a',
        userId: 'referrer-id',
        unlockedAt: null,
        telegramStickerSetName: 'pack_a_by_testbot',
        telegramStickerCount: 3,
      });
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '12345',
        username: 'alice',
      });

      await service.attribute('new-user-id', 'REFCODE', 'email', 'pack-a');
      // Give best-effort fire-and-forget a tick to settle
      await new Promise((r) => setTimeout(r, 0));

      // First pack.update: unlock
      expect(prisma.pack.update).toHaveBeenCalledWith({
        where: { id: 'pack-a' },
        data: { unlockedAt: expect.any(Date) },
      });
      // Second pack.update: sticker count after top-up
      expect(stickerSvc.ensureSet).toHaveBeenCalledTimes(1);
      expect(stickerSvc.ensureSet).toHaveBeenCalledWith(
        expect.objectContaining({
          packId: 'pack-a',
          channelUserId: '12345',
          files: expect.arrayContaining([expect.any(String)]),
        }),
      );
      expect(prisma.pack.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pack-a' },
          data: { telegramStickerCount: 12 },
        }),
      );
      // Message should contain pack link
      expect(bot.sendMessage).toHaveBeenCalledWith(
        '12345',
        expect.stringContaining('t.me/addstickers'),
      );
    });

    it('skips top-up when pack has no Telegram sticker set yet', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      // Pack has no Telegram set yet
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-a',
        userId: 'referrer-id',
        unlockedAt: null,
        telegramStickerSetName: null,
        telegramStickerCount: 0,
      });
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '12345',
        username: 'alice',
      });

      await service.attribute('new-user-id', 'REFCODE', 'email', 'pack-a');
      await new Promise((r) => setTimeout(r, 0));

      expect(stickerSvc.ensureSet).not.toHaveBeenCalled();
      // Still unlocks the pack and sends the notification (without links)
      expect(prisma.pack.update).toHaveBeenCalledWith({
        where: { id: 'pack-a' },
        data: { unlockedAt: expect.any(Date) },
      });
      expect(bot.sendMessage).toHaveBeenCalledTimes(1);
      expect(bot.sendMessage).toHaveBeenCalledWith(
        '12345',
        expect.stringContaining('unlocked'),
      );
    });

    it('does not break attribution when ensureSet throws during top-up', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-fail',
        userId: 'referrer-id',
        unlockedAt: null,
        telegramStickerSetName: 'pack_fail_by_testbot',
        telegramStickerCount: 3,
      });
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '12345',
        username: 'alice',
      });
      (stickerSvc.ensureSet as jest.Mock).mockRejectedValueOnce(
        new Error('Telegram error'),
      );

      // Should not throw
      await expect(
        service.attribute('new-user-id', 'REFCODE', 'email', 'pack-fail'),
      ).resolves.toBeUndefined();
      await new Promise((r) => setTimeout(r, 0));
      // Still sends the notification (even without a link)
      expect(bot.sendMessage).toHaveBeenCalled();
    });

    it('skips top-up for a pack whose real stickers are unavailable', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'referrer-id',
      });
      (prisma.referral.create as jest.Mock).mockResolvedValueOnce({});
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-missing',
        userId: 'referrer-id',
        unlockedAt: null,
        telegramStickerSetName: 'pack_missing_by_testbot',
        telegramStickerCount: 3,
      });
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '12345',
        username: 'alice',
      });
      // This pack's generated stickers are missing on disk → it must be skipped.
      jest.mocked(getPackStickerFiles).mockReturnValueOnce([]);

      await service.attribute(
        'new-user-id',
        'REFCODE',
        'email',
        'pack-missing',
      );
      await new Promise((r) => setTimeout(r, 0));

      // The unavailable pack skips the sticker set top-up
      expect(stickerSvc.ensureSet).not.toHaveBeenCalled();
      // But the pack is still unlocked and notification sent
      expect(prisma.pack.update).toHaveBeenCalledWith({
        where: { id: 'pack-missing' },
        data: { unlockedAt: expect.any(Date) },
      });
      expect(bot.sendMessage).toHaveBeenCalledWith(
        '12345',
        expect.stringContaining('unlocked'),
      );
    });
  });

  describe('recordPending', () => {
    it('upserts with the composite key and a future expiresAt', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      const before = Date.now();
      await service.recordPending('telegram', '42', 'REFCODE', 'pack-uuid');
      const after = Date.now();

      expect(prisma.pendingReferral.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            channel_channelUserId: { channel: 'telegram', channelUserId: '42' },
          },
          create: expect.objectContaining({
            channel: 'telegram',
            channelUserId: '42',
            code: 'REFCODE',
            packId: 'pack-uuid',
            expiresAt: expect.any(Date),
          }),
          update: expect.objectContaining({
            code: 'REFCODE',
            packId: 'pack-uuid',
            expiresAt: expect.any(Date),
          }),
        }),
      );

      const call = (prisma.pendingReferral.upsert as jest.Mock).mock
        .calls[0][0];
      const expiresAtMs = (call.create.expiresAt as Date).getTime();
      // expiresAt should be ~30 days in the future
      expect(expiresAtMs).toBeGreaterThan(before + 29 * 24 * 60 * 60 * 1000);
      expect(expiresAtMs).toBeLessThanOrEqual(
        after + 30 * 24 * 60 * 60 * 1000 + 1000,
      );
    });

    it('maps undefined packId to null in the upsert payload', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      await service.recordPending('telegram', '42', 'REFCODE', undefined);

      const call = (prisma.pendingReferral.upsert as jest.Mock).mock
        .calls[0][0];
      expect(call.create.packId).toBeNull();
      expect(call.update.packId).toBeNull();
    });

    it('does not throw when upsert fails (best-effort)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pendingReferral.upsert as jest.Mock).mockRejectedValueOnce(
        new Error('DB error'),
      );

      await expect(
        service.recordPending('telegram', '42', 'REFCODE', null),
      ).resolves.toBeUndefined();
    });
  });

  describe('consumePending', () => {
    it('returns code and packId when a valid row exists and deletes it', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pendingReferral.delete as jest.Mock).mockResolvedValueOnce({
        channel: 'telegram',
        channelUserId: '42',
        code: 'MYCODE',
        packId: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1_000_000),
      });

      const result = await service.consumePending('telegram', '42');

      expect(prisma.pendingReferral.delete).toHaveBeenCalledWith({
        where: {
          channel_channelUserId: { channel: 'telegram', channelUserId: '42' },
        },
      });
      expect(result).toEqual({
        code: 'MYCODE',
        packId: '550e8400-e29b-41d4-a716-446655440000',
      });
    });

    it('returns null when no pending row exists (P2025)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      const p2025 = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '6.0.0', meta: {} },
      );
      (prisma.pendingReferral.delete as jest.Mock).mockRejectedValueOnce(p2025);

      const result = await service.consumePending('telegram', '42');
      expect(result).toBeNull();
    });

    it('returns null for an expired row (deletes it but treats as absent)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pendingReferral.delete as jest.Mock).mockResolvedValueOnce({
        channel: 'telegram',
        channelUserId: '42',
        code: 'OLDCODE',
        packId: null,
        createdAt: new Date(Date.now() - 60_000),
        expiresAt: new Date(Date.now() - 1_000), // expired 1 second ago
      });

      const result = await service.consumePending('telegram', '42');

      // Row was deleted for cleanup but is stale — return null
      expect(prisma.pendingReferral.delete).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('returns null and does not throw on unexpected errors', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pendingReferral.delete as jest.Mock).mockRejectedValueOnce(
        new Error('DB timeout'),
      );

      const result = await service.consumePending('telegram', '42');
      expect(result).toBeNull();
    });
  });
});
