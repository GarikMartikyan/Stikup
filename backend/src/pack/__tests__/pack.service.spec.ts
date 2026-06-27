import { Prisma } from '@prisma/client';

import type { BotSender } from '../../auth/channel/bot-sender';
import type { TelegramStickerService } from '../../auth/channel/telegram-sticker.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { StickerQueueService } from '../../queue/sticker.queue';
import { PackService } from '../pack.service';
import { getPackStickerFiles } from '../sticker-assets';

function buildPrismaMock() {
  const mock = {
    pack: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
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
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
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

function buildStickerServiceMock(): jest.Mocked<TelegramStickerService> {
  return {
    buildSetName: jest.fn().mockReturnValue('pabcdef_by_testbot'),
    buildTitle: jest.fn().mockReturnValue('Alice by @TestBot'),
    shareUrl: jest
      .fn()
      .mockReturnValue('https://t.me/addstickers/pabcdef_by_testbot'),
    getBotUsername: jest.fn().mockResolvedValue('TestBot'),
    ensureSet: jest.fn().mockResolvedValue({
      name: 'pabcdef_by_testbot',
      shareUrl: 'https://t.me/addstickers/pabcdef_by_testbot',
      count: 3,
    }),
  } as unknown as jest.Mocked<TelegramStickerService>;
}

function buildQueueMock(): jest.Mocked<StickerQueueService> {
  return {
    enqueueWebPack: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<StickerQueueService>;
}

const OFFER_STUB = {
  packSize: 12,
  freeStickerCount: 3,
  referralUnlockEnabled: true,
  stickerDefaultEmoji: '😀',
};

const FAKE_IMAGE = Buffer.from('fake-image-data');

function buildService(
  prisma: jest.Mocked<PrismaService>,
  bot: jest.Mocked<BotSender>,
  stickerSvc?: jest.Mocked<TelegramStickerService>,
  queue?: jest.Mocked<StickerQueueService>,
) {
  return new PackService(
    bot,
    prisma,
    OFFER_STUB,
    stickerSvc ?? buildStickerServiceMock(),
    queue ?? buildQueueMock(),
    { stickerDir: '/tmp/stikup-test-packs' },
  );
}

// Mock fs/promises so staging-file writes don't touch the real filesystem.
const mockRm = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(Buffer.from('stub')),
  rm: (...args: unknown[]) => mockRm(...args),
}));

// Mock the sticker-assets helper so deliverTelegram resolves a dense list of
// real sticker paths without touching the real filesystem.
jest.mock('../sticker-assets', () => ({
  getPackStickerFiles: jest
    .fn()
    .mockReturnValue([
      '/tmp/stikup-test-packs/pack-1/sticker_1.webp',
      '/tmp/stikup-test-packs/pack-1/sticker_2.webp',
      '/tmp/stikup-test-packs/pack-1/sticker_3.webp',
    ]),
}));

// Mock sharp so persistSourceThumbnail + the upload metadata guard don't require
// a native binary in tests. metadata() returns a valid, in-bounds image by
// default; individual tests override it to exercise the rejection paths.
const mockSharpInstance = {
  rotate: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-webp')),
  metadata: jest
    .fn()
    .mockResolvedValue({ format: 'png', width: 1024, height: 768 }),
};
jest.mock('sharp', () => jest.fn(() => mockSharpInstance));

describe('PackService', () => {
  describe('generatePack', () => {
    it('creates a pack with status generating (no stickers) and enqueues web-pack', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const queue = buildQueueMock();
      const service = buildService(prisma, bot, undefined, queue);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-abc',
      });
      (prisma.pack.create as jest.Mock).mockResolvedValueOnce({ id: 'pack-1' });

      const result = await service.generatePack('user-abc', FAKE_IMAGE);

      expect(result).toEqual({ packId: 'pack-1' });
      // No quota transaction — pack is created directly.
      expect(prisma.$transaction).not.toHaveBeenCalled();
      // Pack created with status 'generating' and NO sticker rows
      expect(prisma.pack.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-abc',
          status: 'generating',
        },
        select: { id: true },
      });
      // web-pack job must be enqueued
      expect(queue.enqueueWebPack).toHaveBeenCalledWith(
        expect.objectContaining({ packId: 'pack-1', userId: 'user-abc' }),
      );
    });

    it('persists a source-selfie thumbnail and sets sourceImageUrl up front', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const queue = buildQueueMock();
      const service = buildService(prisma, bot, undefined, queue);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-abc',
      });
      (prisma.pack.create as jest.Mock).mockResolvedValueOnce({ id: 'pack-1' });

      await service.generatePack('user-abc', FAKE_IMAGE);

      // The uploaded selfie is persisted immediately so the result page can show
      // it during generation — not only once the pack is ready.
      expect(prisma.pack.update).toHaveBeenCalledWith({
        where: { id: 'pack-1' },
        data: { sourceImageUrl: '/api/static/packs/pack-1/source.webp' },
      });
    });

    it('still succeeds (no sourceImageUrl) when the selfie thumbnail fails to decode', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const queue = buildQueueMock();
      const service = buildService(prisma, bot, undefined, queue);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-abc',
      });
      (prisma.pack.create as jest.Mock).mockResolvedValueOnce({ id: 'pack-1' });
      // Simulate an undecodable upload (e.g. HEIC the bundled sharp can't read).
      mockSharpInstance.toBuffer.mockRejectedValueOnce(
        new Error('heif: Unsupported codec'),
      );

      const result = await service.generatePack('user-abc', FAKE_IMAGE);

      // Pack creation still succeeds and the job is enqueued — thumbnailing is
      // best-effort and must never block generation.
      expect(result).toEqual({ packId: 'pack-1' });
      expect(queue.enqueueWebPack).toHaveBeenCalledWith(
        expect.objectContaining({ packId: 'pack-1', userId: 'user-abc' }),
      );
      // sourceImageUrl is NOT persisted when the thumbnail can't be produced.
      expect(prisma.pack.update).not.toHaveBeenCalled();
    });

    it('rejects an upload that exceeds the max dimensions (pixel-bomb guard)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const queue = buildQueueMock();
      const service = buildService(prisma, bot, undefined, queue);

      mockSharpInstance.metadata.mockResolvedValueOnce({
        format: 'png',
        width: 12000,
        height: 12000,
      });

      await expect(
        service.generatePack('user-abc', FAKE_IMAGE),
      ).rejects.toThrow(/too large/i);

      // Rejected before any pack row is created or job enqueued.
      expect(prisma.pack.create).not.toHaveBeenCalled();
      expect(queue.enqueueWebPack).not.toHaveBeenCalled();
    });

    it('rejects an undecodable / non-image upload', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const queue = buildQueueMock();
      const service = buildService(prisma, bot, undefined, queue);

      mockSharpInstance.metadata.mockRejectedValueOnce(
        new Error('Input buffer contains unsupported image format'),
      );

      await expect(
        service.generatePack('user-abc', FAKE_IMAGE),
      ).rejects.toThrow(/not a valid image/i);

      expect(prisma.pack.create).not.toHaveBeenCalled();
    });

    it('rejects a disallowed image format', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const queue = buildQueueMock();
      const service = buildService(prisma, bot, undefined, queue);

      mockSharpInstance.metadata.mockResolvedValueOnce({
        format: 'gif',
        width: 512,
        height: 512,
      });

      await expect(
        service.generatePack('user-abc', FAKE_IMAGE),
      ).rejects.toThrow(/PNG, JPEG, or WebP/i);

      expect(prisma.pack.create).not.toHaveBeenCalled();
    });

    it('throws when user does not exist', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.generatePack('nonexistent-user', FAKE_IMAGE),
      ).rejects.toThrow('nonexistent-user not found');

      expect(prisma.pack.create).not.toHaveBeenCalled();
    });

    it('marks pack failed when enqueue throws', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const queue = buildQueueMock();
      const service = buildService(prisma, bot, undefined, queue);

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-abc',
      });
      (prisma.pack.create as jest.Mock).mockResolvedValueOnce({ id: 'pack-1' });
      (queue.enqueueWebPack as jest.Mock).mockRejectedValueOnce(
        new Error('Redis connection refused'),
      );

      await expect(
        service.generatePack('user-abc', FAKE_IMAGE),
      ).rejects.toThrow('Redis connection refused');

      // Pack must be marked failed
      expect(prisma.pack.update).toHaveBeenCalledWith({
        where: { id: 'pack-1' },
        data: { status: 'failed' },
      });
      // No generationsUsed refund — quota is not tracked.
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
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
        sourceImageUrl: null,
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

    it('returns pack detail with unlocked=false for a user who has not been referred', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        status: 'ready',
        userId: 'user-abc',
        sourceImageUrl: null,
        unlockedAt: null,
        stickers: [{ index: 0, url: '/assets/sticker_1.webp' }],
      });

      const result = await service.getPack('pack-1', 'user-abc');
      expect(result).not.toBeNull();
      expect(result!.unlocked).toBe(false);
      expect(result!.freeCount).toBe(3);
      expect(result!.packSize).toBe(12);
    });

    it('returns pack detail with unlocked=true for an unlocked pack', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        status: 'ready',
        userId: 'user-abc',
        sourceImageUrl: null,
        unlockedAt: new Date(),
        stickers: [],
      });

      const result = await service.getPack('pack-1', 'user-abc');
      expect(result!.unlocked).toBe(true);
    });

    it('always returns locked=false and regensLeft=1', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        status: 'ready',
        userId: 'user-abc',
        sourceImageUrl: null,
        unlockedAt: null,
        stickers: [],
      });

      const result = await service.getPack('pack-1', 'user-abc');
      expect(result!.locked).toBe(false);
      expect(result!.regensLeft).toBe(1);
    });

    it('returns selfieUrl when sourceImageUrl is set on the pack', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        status: 'ready',
        userId: 'user-abc',
        sourceImageUrl: '/api/static/packs/pack-1/source.webp',
        unlockedAt: null,
        stickers: [],
      });

      const result = await service.getPack('pack-1', 'user-abc');
      expect(result!.selfieUrl).toBe('/api/static/packs/pack-1/source.webp');
    });

    it('returns selfieUrl=null when sourceImageUrl is not set', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'pack-1',
        status: 'generating',
        userId: 'user-abc',
        sourceImageUrl: null,
        unlockedAt: null,
        stickers: [],
      });

      const result = await service.getPack('pack-1', 'user-abc');
      expect(result!.selfieUrl).toBeNull();
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
          unlockedAt: null,
          stickers: [{ index: 0, url: '/assets/sticker_1.webp' }],
        },
      ]);

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
          locked: false,
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
      // The on-disk pack directory (stickers + source thumbnail) is removed.
      expect(mockRm).toHaveBeenCalledWith('/tmp/stikup-test-packs/pack-1', {
        recursive: true,
        force: true,
      });
    });
  });

  describe('deliverTelegram', () => {
    // Helper to set up a passing deliver scenario
    function setupDeliverBase(
      prisma: jest.Mocked<PrismaService>,
      bot: jest.Mocked<BotSender>,
      opts: { unlocked?: boolean; username?: string | null } = {},
    ) {
      const { unlocked = false, username = 'alice' } = opts;
      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-abc',
        unlockedAt: unlocked ? new Date() : null,
      });
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '99999',
        username,
      });
    }

    it('creates sticker set, persists set info, sends link, returns stickerSetUrl', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      setupDeliverBase(prisma, bot);
      (prisma.packClaim.create as jest.Mock).mockResolvedValueOnce({});

      const result = await service.deliverTelegram('pack-1', 'user-abc');

      expect(result.delivered).toBe(true);
      expect(result.stickerSetUrl).toBe(
        'https://t.me/addstickers/pabcdef_by_testbot',
      );
      expect(stickerSvc.ensureSet).toHaveBeenCalledTimes(1);
      expect(prisma.pack.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pack-1' },
          data: expect.objectContaining({
            telegramStickerCount: 3,
            telegramStickerSetName: 'pabcdef_by_testbot',
          }),
        }),
      );
      expect(bot.sendMessage).toHaveBeenCalledWith(
        '99999',
        expect.stringContaining('t.me/addstickers'),
      );
      // Delivering to Telegram no longer locks the generation counter.
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('re-delivers (sends link again) when P2002 fires on claim insert', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      setupDeliverBase(prisma, bot);

      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: {} },
      );
      (prisma.packClaim.create as jest.Mock).mockRejectedValueOnce(p2002);

      const result = await service.deliverTelegram('pack-1', 'user-abc');

      // Re-delivery still delivers the set link
      expect(result.delivered).toBe(true);
      expect(result.stickerSetUrl).toBeDefined();
      // No rollback of a claim this call did NOT insert
      expect(prisma.packClaim.delete).not.toHaveBeenCalled();
      expect(stickerSvc.ensureSet).toHaveBeenCalledTimes(1);
    });

    it('rolls back own claim and returns delivered:false when ensureSet throws', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      setupDeliverBase(prisma, bot);
      (prisma.packClaim.create as jest.Mock).mockResolvedValueOnce({});
      (stickerSvc.ensureSet as jest.Mock).mockRejectedValueOnce(
        new Error('Telegram API timeout'),
      );
      (prisma.packClaim.delete as jest.Mock).mockResolvedValueOnce({});

      const result = await service.deliverTelegram('pack-1', 'user-abc');

      expect(result).toEqual({
        delivered: false,
        botUrl: 'https://t.me/stikup_bot',
      });
      expect(prisma.packClaim.delete).toHaveBeenCalledWith({
        where: { packId_userId: { packId: 'pack-1', userId: 'user-abc' } },
      });
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('does NOT roll back pre-existing claim when ensureSet throws on re-delivery', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      setupDeliverBase(prisma, bot);

      // Claim already existed (P2002)
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: {} },
      );
      (prisma.packClaim.create as jest.Mock).mockRejectedValueOnce(p2002);
      // ensureSet then fails
      (stickerSvc.ensureSet as jest.Mock).mockRejectedValueOnce(
        new Error('Telegram API timeout'),
      );

      const result = await service.deliverTelegram('pack-1', 'user-abc');

      expect(result.delivered).toBe(false);
      // Must NOT delete the pre-existing claim
      expect(prisma.packClaim.delete).not.toHaveBeenCalled();
    });

    it('does not delete a pre-existing claim when P2002 fires (re-delivery path)', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-abc',
        unlockedAt: null,
      });
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '99999',
        username: 'alice',
      });

      // Simulate the claim already existing (P2002) then ensureSet succeeds.
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: {} },
      );
      (prisma.packClaim.create as jest.Mock).mockRejectedValueOnce(p2002);

      const result = await service.deliverTelegram('pack-1', 'user-abc');

      // Re-delivery → delivered:true
      expect(result.delivered).toBe(true);
      expect(prisma.packClaim.delete).not.toHaveBeenCalled();
    });

    it('aborts and rolls back its own claim when the pack has no generated stickers', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const stickerSvc = buildStickerServiceMock();
      const service = buildService(prisma, bot, stickerSvc);

      setupDeliverBase(prisma, bot);
      (prisma.packClaim.create as jest.Mock).mockResolvedValueOnce({});
      // No real sticker files on disk for this pack (e.g. not generated yet).
      jest.mocked(getPackStickerFiles).mockReturnValueOnce([]);

      const result = await service.deliverTelegram('pack-1', 'user-abc');

      expect(result).toEqual({
        delivered: false,
        botUrl: 'https://t.me/stikup_bot',
      });
      // The set is never touched and the generation counter is unchanged.
      expect(stickerSvc.ensureSet).not.toHaveBeenCalled();
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
      // The claim this call inserted is rolled back.
      expect(prisma.packClaim.delete).toHaveBeenCalledWith({
        where: { packId_userId: { packId: 'pack-1', userId: 'user-abc' } },
      });
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

    it('returns alreadyClaimed:true on the P2002 path without touching user state', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-abc',
      });
      (prisma.channelIdentity.findFirst as jest.Mock).mockResolvedValueOnce({
        channelUserId: '99999',
        channel: 'telegram',
      });
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: {} },
      );
      (prisma.packClaim.create as jest.Mock).mockRejectedValueOnce(p2002);

      const result = await service.claimFreeStickers('pack-1', 'user-abc');

      expect(result.alreadyClaimed).toBe(true);
      // Claiming free stickers no longer locks the generation counter.
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('markDownloaded', () => {
    it('returns locked:false for the pack owner without modifying user state', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'user-abc',
      });

      const result = await service.markDownloaded('pack-1', 'user-abc');

      expect(result).toEqual({ locked: false });
      // Downloads no longer lock the generation counter.
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('does not lock when the pack does not exist', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.markDownloaded('missing', 'user-abc');

      expect(result).toEqual({ locked: false });
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('does not lock when the pack belongs to a different user', async () => {
      const prisma = buildPrismaMock();
      const bot = buildBotSenderMock();
      const service = buildService(prisma, bot);

      (prisma.pack.findUnique as jest.Mock).mockResolvedValueOnce({
        userId: 'other-user',
      });

      const result = await service.markDownloaded('pack-1', 'user-abc');

      expect(result).toEqual({ locked: false });
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });
  });
});
