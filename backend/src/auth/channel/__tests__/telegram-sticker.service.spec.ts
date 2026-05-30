import { TelegramStickerService } from '../telegram-sticker.service';

// ---------------------------------------------------------------------------
// Minimal stubs
// ---------------------------------------------------------------------------

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
};

function buildBotMock() {
  return {
    telegram: {
      getMe: jest.fn().mockResolvedValue({ username: 'TestBot' }),
      getStickerSet: jest.fn(),
      uploadStickerFile: jest.fn(),
      createNewStickerSet: jest.fn().mockResolvedValue(true),
      addStickerToSet: jest.fn().mockResolvedValue(true),
    },
  };
}

function buildService(bot: ReturnType<typeof buildBotMock>) {
  // Bypass NestJS DI: pass the mock bot and offer config stub directly.
  return new TelegramStickerService(bot as never, OFFER_STUB);
}

// ---------------------------------------------------------------------------
// buildSetName
// ---------------------------------------------------------------------------

describe('TelegramStickerService.buildSetName', () => {
  const BOT = 'TestBot';

  it('produces a valid name for a normal UUID', () => {
    const bot = buildBotMock();
    const svc = buildService(bot);
    const packId = '123e4567-e89b-12d3-a456-426614174000';
    const name = svc.buildSetName(packId, BOT);

    // Must match the allowed pattern
    expect(name).toMatch(/^[a-z][a-z0-9_]*_by_.+$/);
    // No consecutive underscores
    expect(name).not.toMatch(/__/);
    // Length constraint
    expect(name.length).toBeLessThanOrEqual(64);
  });

  it('starts with "p"', () => {
    const svc = buildService(buildBotMock());
    const name = svc.buildSetName('aaaabbbb-cccc-dddd-eeee-ffffffffffff', BOT);
    expect(name.startsWith('p')).toBe(true);
  });

  it('strips dashes from packId', () => {
    const svc = buildService(buildBotMock());
    const name = svc.buildSetName('abcd-ef01-2345-6789-abcdef012345', BOT);
    expect(name).not.toContain('-');
  });

  it('ends with _by_<botusername> (lowercased)', () => {
    const svc = buildService(buildBotMock());
    const name = svc.buildSetName(
      '00000000-0000-0000-0000-000000000001',
      'MyBot',
    );
    expect(name.endsWith('_by_mybot')).toBe(true);
  });

  it('clamps to 64 chars and preserves suffix for a long bot username', () => {
    const svc = buildService(buildBotMock());
    // Use a 30-char username (near Telegram's 32-char cap) to verify the suffix survives clamping.
    const longBot = 'a'.repeat(30);
    const name = svc.buildSetName(
      '00000000-0000-0000-0000-000000000001',
      longBot,
    );
    expect(name.length).toBeLessThanOrEqual(64);
    // The mandatory suffix must always be present — this is what Telegram validates.
    expect(name.endsWith(`_by_${longBot.toLowerCase()}`)).toBe(true);
    expect(name).toMatch(/^[a-z][a-z0-9_]*_by_/);
  });

  it('clamps to 64 chars and preserves suffix for an extreme (40-char) bot username', () => {
    const svc = buildService(buildBotMock());
    const longBot = 'a'.repeat(40);
    const name = svc.buildSetName(
      '00000000-0000-0000-0000-000000000001',
      longBot,
    );
    expect(name.length).toBeLessThanOrEqual(64);
    expect(name.endsWith(`_by_${longBot.toLowerCase()}`)).toBe(true);
  });

  it('produces unique names for different packIds', () => {
    const svc = buildService(buildBotMock());
    const n1 = svc.buildSetName('00000000-0000-0000-0000-000000000001', BOT);
    const n2 = svc.buildSetName('00000000-0000-0000-0000-000000000002', BOT);
    expect(n1).not.toBe(n2);
  });
});

// ---------------------------------------------------------------------------
// buildTitle
// ---------------------------------------------------------------------------

describe('TelegramStickerService.buildTitle', () => {
  it('formats with username', () => {
    const svc = buildService(buildBotMock());
    expect(svc.buildTitle('alice', 'TestBot')).toBe(
      'alice Stickers by @TestBot',
    );
  });

  it('uses fallback when no username', () => {
    const svc = buildService(buildBotMock());
    expect(svc.buildTitle('user123456', 'TestBot')).toBe(
      'user123456 Stickers by @TestBot',
    );
  });

  it('clamps to 64 chars', () => {
    const svc = buildService(buildBotMock());
    const longName = 'x'.repeat(100);
    const title = svc.buildTitle(longName, 'TestBot');
    expect(title.length).toBeLessThanOrEqual(64);
  });
});

// ---------------------------------------------------------------------------
// shareUrl
// ---------------------------------------------------------------------------

describe('TelegramStickerService.shareUrl', () => {
  it('returns correct t.me URL', () => {
    const svc = buildService(buildBotMock());
    expect(svc.shareUrl('mypack_by_testbot')).toBe(
      'https://t.me/addstickers/mypack_by_testbot',
    );
  });
});

// ---------------------------------------------------------------------------
// ensureSet — create path (set not found)
// ---------------------------------------------------------------------------

describe('TelegramStickerService.ensureSet', () => {
  const PACK_ID = '123e4567-e89b-12d3-a456-426614174000';
  const FILES = ['/tmp/a.webp', '/tmp/b.webp', '/tmp/c.webp'];

  it('creates a new set when getStickerSet returns not-found error', async () => {
    const bot = buildBotMock();
    const svc = buildService(bot);

    // Simulate not-found
    const notFoundErr = Object.assign(new Error('Not Found'), {
      code: 400,
      description: 'STICKERSET_INVALID',
    });
    bot.telegram.getStickerSet.mockRejectedValueOnce(notFoundErr);

    // Each upload returns a file_id
    bot.telegram.uploadStickerFile
      .mockResolvedValueOnce({ file_id: 'fid1' })
      .mockResolvedValueOnce({ file_id: 'fid2' })
      .mockResolvedValueOnce({ file_id: 'fid3' });

    const result = await svc.ensureSet({
      channelUserId: '12345',
      packId: PACK_ID,
      usernameOrFallback: 'alice',
      files: FILES,
    });

    expect(bot.telegram.createNewStickerSet).toHaveBeenCalledTimes(1);
    expect(bot.telegram.addStickerToSet).not.toHaveBeenCalled();
    expect(result.count).toBe(3);
    expect(result.shareUrl).toContain('t.me/addstickers/');
    expect(result.name).toBeTruthy();
    expect(result.shareUrl).toContain(result.name);
  });

  it('appends only missing stickers when set already has k stickers', async () => {
    const bot = buildBotMock();
    const svc = buildService(bot);

    // Set exists with 1 sticker
    bot.telegram.getStickerSet.mockResolvedValueOnce({
      stickers: [{ file_id: 'existing' }],
    });

    // Upload 2 missing files
    bot.telegram.uploadStickerFile
      .mockResolvedValueOnce({ file_id: 'fid2' })
      .mockResolvedValueOnce({ file_id: 'fid3' });

    const result = await svc.ensureSet({
      channelUserId: '12345',
      packId: PACK_ID,
      usernameOrFallback: 'alice',
      files: FILES,
    });

    expect(bot.telegram.createNewStickerSet).not.toHaveBeenCalled();
    // addStickerToSet called for each missing file
    expect(bot.telegram.addStickerToSet).toHaveBeenCalledTimes(2);
    expect(result.count).toBe(3);
  });

  it('is a no-op when set already has >= files.length stickers', async () => {
    const bot = buildBotMock();
    const svc = buildService(bot);

    // Set already fully populated
    bot.telegram.getStickerSet.mockResolvedValueOnce({
      stickers: [{ file_id: 'a' }, { file_id: 'b' }, { file_id: 'c' }],
    });

    const result = await svc.ensureSet({
      channelUserId: '12345',
      packId: PACK_ID,
      usernameOrFallback: 'alice',
      files: FILES,
    });

    expect(bot.telegram.createNewStickerSet).not.toHaveBeenCalled();
    expect(bot.telegram.addStickerToSet).not.toHaveBeenCalled();
    expect(bot.telegram.uploadStickerFile).not.toHaveBeenCalled();
    expect(result.count).toBe(3);
  });

  it('rethrows non-not-found errors from getStickerSet', async () => {
    const bot = buildBotMock();
    const svc = buildService(bot);

    const realError = Object.assign(new Error('Internal Server Error'), {
      code: 500,
      description: 'Some other error',
    });
    bot.telegram.getStickerSet.mockRejectedValueOnce(realError);

    await expect(
      svc.ensureSet({
        channelUserId: '12345',
        packId: PACK_ID,
        usernameOrFallback: 'alice',
        files: FILES,
      }),
    ).rejects.toThrow('Internal Server Error');

    expect(bot.telegram.createNewStickerSet).not.toHaveBeenCalled();
    expect(bot.telegram.uploadStickerFile).not.toHaveBeenCalled();
  });

  it('returns name that ends with _by_<botusername>', async () => {
    const bot = buildBotMock();
    const svc = buildService(bot);

    const notFoundErr = Object.assign(new Error('Not Found'), {
      code: 400,
      description: 'STICKERSET_INVALID',
    });
    bot.telegram.getStickerSet.mockRejectedValueOnce(notFoundErr);
    bot.telegram.uploadStickerFile
      .mockResolvedValueOnce({ file_id: 'fid1' })
      .mockResolvedValueOnce({ file_id: 'fid2' })
      .mockResolvedValueOnce({ file_id: 'fid3' });

    const result = await svc.ensureSet({
      channelUserId: '12345',
      packId: PACK_ID,
      usernameOrFallback: 'alice',
      files: FILES,
    });

    // getMe returns 'TestBot', so the name must end with _by_testbot
    expect(result.name.endsWith('_by_testbot')).toBe(true);
    expect(result.shareUrl).toBe(`https://t.me/addstickers/${result.name}`);
  });
});
