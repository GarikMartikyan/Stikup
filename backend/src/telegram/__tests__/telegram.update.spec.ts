import { ConflictException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { I18nService } from 'nestjs-i18n';
import type { Context, Telegraf } from 'telegraf';

import type { TelegramAdapter } from '../../auth/channel/telegram-adapter';
import type { frontendConfig } from '../../config/frontend.config';
import type { telegramConfig } from '../../config/telegram.config';
import type { IdentityService } from '../../auth/identity.service';
import type { StickerQueueService } from '../../queue/sticker.queue';
import type { TokenService } from '../../auth/token.service';
import { TelegramUpdate } from '../telegram.update';

function buildUpdate(overrides?: {
  fromContext?: jest.Mock;
  miniAppUrl?: string;
}): {
  update: TelegramUpdate;
  bot: { telegram: Record<string, jest.Mock> };
  i18n: { t: jest.Mock };
  tokens: {
    mint: jest.Mock;
    attachTelegramMessage: jest.Mock;
    consumeLink: jest.Mock;
  };
  identity: { resolveOrCreate: jest.Mock; linkChannel: jest.Mock };
} {
  const bot = {
    telegram: {
      setMyCommands: jest.fn(),
      editMessageReplyMarkup: jest.fn(),
      setChatMenuButton: jest.fn().mockResolvedValue(undefined),
    },
  } as unknown as Telegraf<Context>;

  const frontend = {
    publicAppUrl: 'http://localhost:3000',
  } as unknown as ConfigType<typeof frontendConfig>;

  const telegramCfg = {
    botToken: 'fake:token',
    initDataMaxAgeSec: 86400,
    miniAppUrl: overrides?.miniAppUrl,
  } as unknown as ConfigType<typeof telegramConfig>;

  const telegramAdapter = {
    fromContext:
      overrides?.fromContext ??
      jest.fn(() =>
        Promise.resolve({
          channel: 'telegram',
          channelUserId: '42',
          profile: {},
        }),
      ),
  } as unknown as TelegramAdapter;

  const identity = {
    resolveOrCreate: jest.fn(() => Promise.resolve({ userId: 'user-1' })),
    linkChannel: jest.fn(() => Promise.resolve({ status: 'linked' })),
  };

  const tokens = {
    mint: jest.fn(() => Promise.resolve('token-abc')),
    attachTelegramMessage: jest.fn(() => Promise.resolve(undefined)),
    consumeLink: jest.fn(() => Promise.resolve(null)),
  };

  const stickerQueue = {
    enqueue: jest.fn(() => Promise.resolve(undefined)),
  } as unknown as StickerQueueService;

  // Stand-in for nestjs-i18n: echo the key so we can assert it was translated.
  const i18n = { t: jest.fn((key: string) => `translated:${key}`) };

  const update = new TelegramUpdate(
    bot,
    frontend,
    telegramCfg,
    telegramAdapter,
    identity as unknown as IdentityService,
    tokens as unknown as TokenService,
    stickerQueue,
    i18n as unknown as I18nService,
  );

  return {
    update,
    bot: bot as unknown as { telegram: Record<string, jest.Mock> },
    i18n,
    tokens,
    identity,
  };
}

function buildCtx(
  languageCode = 'en',
  startText = '',
): Context & {
  reply: jest.Mock;
  replyWithPhoto: jest.Mock;
} {
  return {
    from: { id: 42, language_code: languageCode },
    chat: { id: 99 },
    message: { message_id: 7, text: startText || '/start' },
    reply: jest.fn(() => Promise.resolve({ message_id: 1, chat: { id: 99 } })),
    replyWithPhoto: jest.fn(() =>
      Promise.resolve({ message_id: 100, chat: { id: 99 } }),
    ),
  } as unknown as Context & { reply: jest.Mock; replyWithPhoto: jest.Mock };
}

describe('TelegramUpdate', () => {
  describe('onModuleInit', () => {
    it('calls setChatMenuButton and setMyCommands when miniAppUrl is HTTPS', async () => {
      const { update, bot } = buildUpdate({
        miniAppUrl: 'https://stikup.app/app',
      });

      await update.onModuleInit();

      expect(bot.telegram.setMyCommands).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ command: 'login' })]),
      );
      expect(bot.telegram.setChatMenuButton).toHaveBeenCalledWith({
        menuButton: {
          type: 'web_app',
          text: 'Open StikUp',
          web_app: { url: 'https://stikup.app/app' },
        },
      });
    });

    it('calls setChatMenuButton with the derived http URL when miniAppUrl is unset', async () => {
      // miniAppUrl is undefined -> falls back to frontend.publicAppUrl + '/app'
      const { update, bot } = buildUpdate();

      await update.onModuleInit();

      expect(bot.telegram.setChatMenuButton).toHaveBeenCalledWith({
        menuButton: {
          type: 'web_app',
          text: 'Open StikUp',
          web_app: { url: 'http://localhost:3000/app' },
        },
      });
    });

    it('resolves without throwing when setChatMenuButton rejects', async () => {
      const { update, bot } = buildUpdate();
      bot.telegram.setChatMenuButton.mockRejectedValueOnce(
        new Error('Telegram API unavailable'),
      );

      await expect(update.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('/login', () => {
    it('sends a photo + sign-in button with a translated caption (no ctx.t)', async () => {
      const { update, i18n, tokens } = buildUpdate();
      const ctx = buildCtx('en');

      // Regression: previously threw `TypeError: ctx.t is not a function`.
      await expect(update.onLogin(ctx)).resolves.toBeUndefined();

      expect(i18n.t).toHaveBeenCalledWith('telegram.login.caption', {
        lang: 'en',
        args: undefined,
      });

      const [photo, extra] = ctx.replyWithPhoto.mock.calls[0];
      expect(photo).toEqual({ source: expect.stringContaining('logo.png') });
      expect(extra.caption).toBe('translated:telegram.login.caption');

      // miniAppUrl is http:// so only the plain URL login button is sent (no web_app button).
      const [loginButton] = extra.reply_markup.inline_keyboard[0];
      expect(loginButton.text).toBe('translated:telegram.login.button');
      expect(loginButton.url).toBe(
        'http://localhost:3000/auth/exchange?t=token-abc',
      );
      // No web_app button in non-HTTPS dev.
      expect(extra.reply_markup.inline_keyboard[0]).toHaveLength(1);

      expect(tokens.attachTelegramMessage).toHaveBeenCalledWith(
        'token-abc',
        BigInt(99),
        100,
        7,
      );
    });

    it('includes the web_app button when miniAppUrl is HTTPS', async () => {
      const { update } = buildUpdate({ miniAppUrl: 'https://stikup.app/app' });
      const ctx = buildCtx('en');

      await update.onLogin(ctx);

      const [, extra] = ctx.replyWithPhoto.mock.calls[0];
      const [webAppButton, loginButton] = extra.reply_markup.inline_keyboard[0];
      expect(webAppButton.text).toBe('Open StikUp');
      expect(webAppButton.web_app).toBeDefined();
      expect(webAppButton.web_app.url).toBe('https://stikup.app/app');
      expect(loginButton.url).toContain('/auth/exchange?t=');
    });

    it('falls back to a plain-URL-only markup when replyWithPhoto fails', async () => {
      const { update } = buildUpdate({ miniAppUrl: 'https://stikup.app/app' });
      const ctx = buildCtx('en');
      ctx.replyWithPhoto.mockRejectedValueOnce(new Error('file not found'));

      await expect(update.onLogin(ctx)).resolves.toBeUndefined();

      // Fallback reply must use plain-URL markup only (no web_app button).
      const [, extra] = ctx.reply.mock.calls[0];
      const row = extra.reply_markup.inline_keyboard[0];
      expect(row).toHaveLength(1);
      expect(row[0].url).toContain('/auth/exchange?t=');
      expect(row[0].web_app).toBeUndefined();
    });

    it('resolves Russian clients to the ru locale', async () => {
      const { update, i18n } = buildUpdate();
      const ctx = buildCtx('ru-RU');

      await update.onLogin(ctx);

      expect(i18n.t).toHaveBeenCalledWith('telegram.login.caption', {
        lang: 'ru',
        args: undefined,
      });
    });

    it('replies with a translated error when no profile can be read', async () => {
      const { update } = buildUpdate({
        fromContext: jest.fn(() => Promise.resolve(null)),
      });
      const ctx = buildCtx('en');

      await update.onLogin(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        'translated:telegram.errors.no_profile',
      );
      expect(ctx.replyWithPhoto).not.toHaveBeenCalled();
    });
  });

  describe('/start with link_ payload', () => {
    it('replies with expired message when consumeLink returns null', async () => {
      const { update, tokens } = buildUpdate();
      tokens.consumeLink.mockResolvedValueOnce(null);

      const ctx = buildCtx('en', '/start link_bad-token');
      await update.onStart(ctx);

      expect(tokens.consumeLink).toHaveBeenCalledWith('bad-token');
      expect(ctx.reply).toHaveBeenCalledWith(
        'translated:telegram.link.expired',
      );
      expect(ctx.replyWithPhoto).not.toHaveBeenCalled();
    });

    it('replies with no_profile when fromContext returns null', async () => {
      const { update, tokens } = buildUpdate({
        fromContext: jest.fn(() => Promise.resolve(null)),
      });
      tokens.consumeLink.mockResolvedValueOnce({
        userId: 'u-link',
      });

      const ctx = buildCtx('en', '/start link_valid-token');
      await update.onStart(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        'translated:telegram.errors.no_profile',
      );
    });

    it('replies with success after successful linkChannel', async () => {
      const { update, tokens, identity } = buildUpdate();
      tokens.consumeLink.mockResolvedValueOnce({
        userId: 'u-link',
      });
      identity.linkChannel.mockResolvedValueOnce({
        status: 'linked',
      });

      const ctx = buildCtx('en', '/start link_valid-token');
      await update.onStart(ctx);

      expect(identity.linkChannel).toHaveBeenCalledWith(
        'u-link',
        expect.objectContaining({ channel: 'telegram' }),
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        'translated:telegram.link.success',
      );
    });

    it('replies with conflict message when linkChannel throws ConflictException', async () => {
      const { update, tokens, identity } = buildUpdate();
      tokens.consumeLink.mockResolvedValueOnce({
        userId: 'u-link',
      });
      identity.linkChannel.mockRejectedValueOnce(
        new ConflictException('channel_taken'),
      );

      const ctx = buildCtx('en', '/start link_valid-token');
      await update.onStart(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        'translated:telegram.link.conflict',
      );
    });

    it('replies with failed message on unexpected errors', async () => {
      const { update, tokens, identity } = buildUpdate();
      tokens.consumeLink.mockResolvedValueOnce({
        userId: 'u-link',
      });
      identity.linkChannel.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      const ctx = buildCtx('en', '/start link_valid-token');
      await update.onStart(ctx);

      expect(ctx.reply).toHaveBeenCalledWith('translated:telegram.link.failed');
    });

    it('falls through to normal login flow when no payload is present', async () => {
      const { update } = buildUpdate();

      const ctx = buildCtx('en', '/start');
      await update.onStart(ctx);

      // Normal login flow sends a photo
      expect(ctx.replyWithPhoto).toHaveBeenCalled();
    });
  });
});
