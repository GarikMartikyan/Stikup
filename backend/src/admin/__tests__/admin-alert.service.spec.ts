import { Logger } from '@nestjs/common';

import { AdminAlertService } from '../admin-alert.service';

function buildBotMock() {
  return {
    telegram: {
      sendMessage: jest.fn().mockResolvedValue({}),
    },
  };
}

function buildTgConfig(adminChatId?: number) {
  return {
    botToken: 'test-token',
    initDataMaxAgeSec: 3600,
    launchBot: false,
    adminChatId,
  };
}

describe('AdminAlertService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {
      // suppress noise
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not send when adminChatId is undefined', async () => {
    const bot = buildBotMock();
    const tg = buildTgConfig(undefined);
    const service = new AdminAlertService(bot as never, tg);

    await service.alert('test message');

    expect(bot.telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('enabled returns false when adminChatId is undefined', () => {
    const bot = buildBotMock();
    const service = new AdminAlertService(
      bot as never,
      buildTgConfig(undefined),
    );
    expect(service.enabled).toBe(false);
  });

  it('enabled returns true when adminChatId is set', () => {
    const bot = buildBotMock();
    const service = new AdminAlertService(bot as never, buildTgConfig(12345));
    expect(service.enabled).toBe(true);
  });

  it('sends alert to adminChatId with 🚨 prefix', async () => {
    const bot = buildBotMock();
    const service = new AdminAlertService(bot as never, buildTgConfig(99999));

    await service.alert('something went wrong');

    expect(bot.telegram.sendMessage).toHaveBeenCalledTimes(1);
    const [chatId, text] = bot.telegram.sendMessage.mock.calls[0];
    expect(chatId).toBe(99999);
    expect(typeof text).toBe('string');
    expect(text).toContain('something went wrong');
    // prefix is the 🚨 emoji (U+1F6A8)
    expect(text.startsWith('\u{1F6A8}')).toBe(true);
  });

  it('sends info to adminChatId with ℹ️ prefix', async () => {
    const bot = buildBotMock();
    const service = new AdminAlertService(bot as never, buildTgConfig(99999));

    await service.info('backend is up');

    expect(bot.telegram.sendMessage).toHaveBeenCalledTimes(1);
    const [chatId, text] = bot.telegram.sendMessage.mock.calls[0];
    expect(chatId).toBe(99999);
    expect(text).toContain('backend is up');
    expect(text.startsWith('ℹ️')).toBe(true);
  });

  it('deduplication: same key within cooldown sends only once', async () => {
    const bot = buildBotMock();
    const service = new AdminAlertService(bot as never, buildTgConfig(1));

    await service.alert('first', { dedupeKey: 'test-key', cooldownMs: 60_000 });
    await service.alert('second', {
      dedupeKey: 'test-key',
      cooldownMs: 60_000,
    });

    expect(bot.telegram.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('deduplication: distinct keys both send', async () => {
    const bot = buildBotMock();
    const service = new AdminAlertService(bot as never, buildTgConfig(1));

    await service.alert('first', { dedupeKey: 'key-A', cooldownMs: 60_000 });
    await service.alert('second', { dedupeKey: 'key-B', cooldownMs: 60_000 });

    expect(bot.telegram.sendMessage).toHaveBeenCalledTimes(2);
  });

  it('deduplication: same key after cooldown expires sends again', async () => {
    jest.useFakeTimers();
    const bot = buildBotMock();
    const service = new AdminAlertService(bot as never, buildTgConfig(1));

    await service.alert('first', { dedupeKey: 'key-X', cooldownMs: 1_000 });
    jest.advanceTimersByTime(2_000);
    await service.alert('second', { dedupeKey: 'key-X', cooldownMs: 1_000 });

    expect(bot.telegram.sendMessage).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('swallows sendMessage errors without throwing', async () => {
    const bot = buildBotMock();
    bot.telegram.sendMessage.mockRejectedValue(new Error('network error'));
    const service = new AdminAlertService(bot as never, buildTgConfig(1));

    await expect(service.alert('oops')).resolves.toBeUndefined();
  });

  it('bounds the cooldown map by evicting the oldest keys', async () => {
    const bot = buildBotMock();
    const service = new AdminAlertService(bot as never, buildTgConfig(1));

    // Reserve a cooldown for the oldest key.
    await service.alert('first', { dedupeKey: 'oldest', cooldownMs: 60_000 });

    // Flood with > MAX_COOLDOWN_ENTRIES (1000) distinct keys, evicting 'oldest'.
    for (let i = 0; i <= 1001; i++) {
      await service.alert('x', { dedupeKey: 'k' + i, cooldownMs: 60_000 });
    }

    // 'oldest' was evicted, so re-alerting with it sends again even though its
    // cooldown window has not elapsed.
    const before = bot.telegram.sendMessage.mock.calls.length;
    await service.alert('again', { dedupeKey: 'oldest', cooldownMs: 60_000 });
    expect(bot.telegram.sendMessage.mock.calls.length).toBe(before + 1);
  });
});
