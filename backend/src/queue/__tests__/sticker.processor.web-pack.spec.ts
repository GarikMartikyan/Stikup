import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { Job } from 'bullmq';

import type { BotSender } from '../../auth/channel/bot-sender';
import type { ImageProcessingService } from '../../image-processing/image-processing.service';
import type { PrismaService } from '../../prisma/prisma.service';
import { StickerProcessor } from '../sticker.processor';
import type { WebPackJobData } from '../sticker.queue';

// Inline the mock object inside the factory so jest.mock hoisting does not
// produce a "Cannot access before initialization" TDZ error on fsMock.
const mockCopyFile = jest.fn().mockResolvedValue(undefined);
const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockRm = jest.fn().mockResolvedValue(undefined);
const mockReadFile = jest
  .fn()
  .mockResolvedValue(Buffer.from('fake-source-image'));
const mockWriteFile = jest.fn().mockResolvedValue(undefined);

jest.mock('node:fs/promises', () => ({
  copyFile: (...args: unknown[]) => mockCopyFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  rm: (...args: unknown[]) => mockRm(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

// Mock sharp so the processor does not require a native binary in tests.
const mockSharpInstance = {
  rotate: jest.fn().mockReturnThis(),
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-webp')),
};
jest.mock('sharp', () => jest.fn(() => mockSharpInstance));

const FAKE_STICKER_DIR = join(tmpdir(), 'stikup-test-packs');
const FAKE_PACK_ID = 'pack-test-uuid';
const FAKE_USER_ID = 'user-test-uuid';
const FAKE_SOURCE_PATH = join(tmpdir(), 'stikup-src', FAKE_PACK_ID);

function makeSortedWebpPaths(count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) =>
      `/tmp/stickers_job/sticker_${String(i + 1).padStart(2, '0')}.webp`,
  );
}

function buildPrismaMock() {
  const mock = {
    pack: {
      update: jest.fn().mockResolvedValue({}),
    },
    sticker: {
      createMany: jest.fn().mockResolvedValue({ count: 12 }),
    },
    user: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn(),
  };
  mock.$transaction.mockImplementation((fn: (tx: typeof mock) => unknown) =>
    fn(mock),
  );
  return mock as unknown as jest.Mocked<PrismaService>;
}

function buildImageProcessingMock(stickerCount = 12) {
  const cleanup = jest.fn().mockResolvedValue(undefined);
  const mock = {
    generateStickers: jest.fn().mockResolvedValue({
      stickerPaths: makeSortedWebpPaths(stickerCount),
      cleanup,
    }),
    _cleanup: cleanup,
  };
  return mock as unknown as jest.Mocked<ImageProcessingService> & {
    _cleanup: jest.Mock;
  };
}

function buildBotSenderMock(): jest.Mocked<BotSender> {
  return {
    channel: 'telegram' as const,
    sendSticker: jest.fn().mockResolvedValue(undefined),
    sendMessage: jest.fn().mockResolvedValue(undefined),
    getBotUrl: jest.fn().mockResolvedValue('https://t.me/stikup_bot'),
  };
}

function buildProcessor(
  imageProcessing: ImageProcessingService,
  prisma: jest.Mocked<PrismaService>,
  botSender: jest.Mocked<BotSender>,
) {
  return new StickerProcessor(imageProcessing, botSender, prisma, {
    stickerDir: FAKE_STICKER_DIR,
  });
}

function makeJob(data: WebPackJobData): Job<WebPackJobData> {
  return { id: 'job-1', name: 'web-pack', data } as Job<WebPackJobData>;
}

const JOB_DATA: WebPackJobData = {
  packId: FAKE_PACK_ID,
  userId: FAKE_USER_ID,
  sourceImagePath: FAKE_SOURCE_PATH,
};

describe('StickerProcessor — web-pack branch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default resolved values after clearAllMocks resets them.
    mockCopyFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockRm.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue(Buffer.from('fake-source-image'));
    mockWriteFile.mockResolvedValue(undefined);
    // Restore sharp chain mocks.
    mockSharpInstance.rotate.mockReturnThis();
    mockSharpInstance.resize.mockReturnThis();
    mockSharpInstance.webp.mockReturnThis();
    mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('fake-webp'));
  });

  it('success: creates 12 sticker rows, sets status ready, and calls cleanup', async () => {
    const prisma = buildPrismaMock();
    const imgSvc = buildImageProcessingMock(12);
    const bot = buildBotSenderMock();
    const processor = buildProcessor(imgSvc, prisma, bot);

    await processor.process(makeJob(JOB_DATA));

    // Stickers created
    expect(prisma.sticker.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          packId: FAKE_PACK_ID,
          index: 0,
          url: `/api/static/packs/${FAKE_PACK_ID}/sticker_1.webp`,
        }),
        expect.objectContaining({
          packId: FAKE_PACK_ID,
          index: 11,
          url: `/api/static/packs/${FAKE_PACK_ID}/sticker_12.webp`,
        }),
      ]),
    });
    const stickersArg = (prisma.sticker.createMany as jest.Mock).mock
      .calls[0][0].data as Array<{ index: number }>;
    expect(stickersArg).toHaveLength(12);

    // Pack marked ready with sourceImageUrl
    expect(prisma.pack.update).toHaveBeenCalledWith({
      where: { id: FAKE_PACK_ID },
      data: {
        status: 'ready',
        sourceImageUrl: `/api/static/packs/${FAKE_PACK_ID}/source.webp`,
      },
    });

    // source.webp written to pack directory
    const packDir = join(FAKE_STICKER_DIR, FAKE_PACK_ID);
    expect(mockWriteFile).toHaveBeenCalledWith(
      join(packDir, 'source.webp'),
      expect.any(Buffer),
    );

    // No refund
    expect(prisma.user.updateMany).not.toHaveBeenCalled();

    // Cleanup called
    expect((imgSvc as any)._cleanup).toHaveBeenCalledTimes(1);

    // Staging file removed
    expect(mockRm).toHaveBeenCalledWith(FAKE_SOURCE_PATH, { force: true });
  });

  it('failure (fewer than 12 stickers): sets status failed, refunds generationsUsed, calls cleanup', async () => {
    const prisma = buildPrismaMock();
    const imgSvc = buildImageProcessingMock(5); // only 5 stickers
    const bot = buildBotSenderMock();
    const processor = buildProcessor(imgSvc, prisma, bot);

    await processor.process(makeJob(JOB_DATA));

    // Pack marked failed
    expect(prisma.pack.update).toHaveBeenCalledWith({
      where: { id: FAKE_PACK_ID },
      data: { status: 'failed' },
    });

    // generationsUsed refunded (floor at 0)
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: FAKE_USER_ID, generationsUsed: { gt: 0 } },
      data: { generationsUsed: { decrement: 1 } },
    });

    // Cleanup still called
    expect((imgSvc as any)._cleanup).toHaveBeenCalledTimes(1);

    // Staging file removed even on failure
    expect(mockRm).toHaveBeenCalledWith(FAKE_SOURCE_PATH, { force: true });
  });

  it('failure (generateStickers throws): sets status failed, refunds, staging file removed', async () => {
    const prisma = buildPrismaMock();
    const bot = buildBotSenderMock();
    const neverCalledCleanup = jest.fn().mockResolvedValue(undefined);
    const imgSvc = {
      generateStickers: jest
        .fn()
        .mockRejectedValue(new Error('python crashed')),
    } as unknown as jest.Mocked<ImageProcessingService>;
    const processor = buildProcessor(imgSvc, prisma, bot);

    await processor.process(makeJob(JOB_DATA));

    expect(prisma.pack.update).toHaveBeenCalledWith({
      where: { id: FAKE_PACK_ID },
      data: { status: 'failed' },
    });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: FAKE_USER_ID, generationsUsed: { gt: 0 } },
      data: { generationsUsed: { decrement: 1 } },
    });
    expect(mockRm).toHaveBeenCalledWith(FAKE_SOURCE_PATH, { force: true });
    // cleanup was never obtained because generateStickers threw
    expect(neverCalledCleanup).not.toHaveBeenCalled();
  });

  it('failure: does not set sourceImageUrl on the pack', async () => {
    const prisma = buildPrismaMock();
    const imgSvc = buildImageProcessingMock(5); // fewer than 12 → failure
    const bot = buildBotSenderMock();
    const processor = buildProcessor(imgSvc, prisma, bot);

    await processor.process(makeJob(JOB_DATA));

    // Pack update on the failure path must not contain sourceImageUrl
    expect(prisma.pack.update).toHaveBeenCalledWith({
      where: { id: FAKE_PACK_ID },
      data: { status: 'failed' },
    });
    const updateData = (prisma.pack.update as jest.Mock).mock.calls[0][0]
      .data as Record<string, unknown>;
    expect(updateData).not.toHaveProperty('sourceImageUrl');
  });

  it('selfie thumbnail failure (sharp throws): pack still succeeds with sourceImageUrl null', async () => {
    const prisma = buildPrismaMock();
    const imgSvc = buildImageProcessingMock(12);
    const bot = buildBotSenderMock();
    // Simulate an undecodable upload (e.g. HEIC the bundled sharp can't read).
    mockSharpInstance.toBuffer.mockRejectedValueOnce(
      new Error('heif: Unsupported codec'),
    );
    const processor = buildProcessor(imgSvc, prisma, bot);

    await processor.process(makeJob(JOB_DATA));

    // Pack still marked ready, but sourceImageUrl is null (best-effort skip).
    expect(prisma.pack.update).toHaveBeenCalledWith({
      where: { id: FAKE_PACK_ID },
      data: { status: 'ready', sourceImageUrl: null },
    });

    // 12 stickers still created — the pack is not failed.
    const stickersArg = (prisma.sticker.createMany as jest.Mock).mock
      .calls[0][0].data as unknown[];
    expect(stickersArg).toHaveLength(12);

    // source.webp NOT written, and no generation refund.
    const packDir = join(FAKE_STICKER_DIR, FAKE_PACK_ID);
    expect(mockWriteFile).not.toHaveBeenCalledWith(
      join(packDir, 'source.webp'),
      expect.any(Buffer),
    );
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('copies sticker files into the pack directory', async () => {
    const prisma = buildPrismaMock();
    const imgSvc = buildImageProcessingMock(12);
    const bot = buildBotSenderMock();
    const processor = buildProcessor(imgSvc, prisma, bot);

    await processor.process(makeJob(JOB_DATA));

    // Should have copied 12 files
    expect(mockCopyFile).toHaveBeenCalledTimes(12);

    // First sticker copy
    const packDir = join(FAKE_STICKER_DIR, FAKE_PACK_ID);
    expect(mockCopyFile).toHaveBeenCalledWith(
      expect.stringContaining('sticker'),
      join(packDir, 'sticker_1.webp'),
    );
  });
});
