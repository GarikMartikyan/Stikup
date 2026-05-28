import type { ConfigType } from '@nestjs/config';
import type { I18nService } from 'nestjs-i18n';
import type { Context, Telegraf } from 'telegraf';

import type { TelegramAdapter } from '../../auth/channel/telegram-adapter';
import type { frontendConfig } from '../../config/frontend.config';
import type { IdentityService } from '../../auth/identity.service';
import type { StickerQueueService } from '../../queue/sticker.queue';
import type { TokenService } from '../../auth/token.service';
import { TelegramUpdate } from '../telegram.update';

function buildUpdate(overrides?: { fromContext?: jest.Mock }): {
  update: TelegramUpdate;
  i18n: { t: jest.Mock };
  tokens: { mint: jest.Mock; attachTelegramMessage: jest.Mock };
} {
  const bot = {
    telegram: { setMyCommands: jest.fn(), editMessageReplyMarkup: jest.fn() },
  } as unknown as Telegraf<Context>;

  const frontend = {
    publicAppUrl: 'http://localhost:3000',
  } as unknown as ConfigType<typeof frontendConfig>;

  const telegramAdapter = {
    fromContext:
      overrides?.fromContext ??
      jest.fn(() => ({ channel: 'telegram', channelUserId: '42' })),
  } as unknown as TelegramAdapter;

  const identity = {
    resolveOrCreate: jest.fn(() => Promise.resolve({ userId: 'user-1' })),
  } as unknown as IdentityService;

  const tokens = {
    mint: jest.fn(() => Promise.resolve('token-abc')),
    attachTelegramMessage: jest.fn(() => Promise.resolve(undefined)),
  };

  const stickerQueue = {
    enqueue: jest.fn(() => Promise.resolve(undefined)),
  } as unknown as StickerQueueService;

  // Stand-in for nestjs-i18n: echo the key so we can assert it was translated.
  const i18n = { t: jest.fn((key: string) => `translated:${key}`) };

  const update = new TelegramUpdate(
    bot,
    frontend,
    telegramAdapter,
    identity,
    tokens as unknown as TokenService,
    stickerQueue,
    i18n as unknown as I18nService,
  );

  return { update, i18n, tokens };
}

function buildCtx(languageCode = 'en'): Context & {
  reply: jest.Mock;
  replyWithPhoto: jest.Mock;
} {
  return {
    from: { id: 42, language_code: languageCode },
    chat: { id: 99 },
    message: { message_id: 7 },
    reply: jest.fn(() => Promise.resolve({ message_id: 1, chat: { id: 99 } })),
    replyWithPhoto: jest.fn(() =>
      Promise.resolve({ message_id: 100, chat: { id: 99 } }),
    ),
  } as unknown as Context & { reply: jest.Mock; replyWithPhoto: jest.Mock };
}

describe('TelegramUpdate', () => {
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

      const button = extra.reply_markup.inline_keyboard[0][0];
      expect(button.text).toBe('translated:telegram.login.button');
      expect(button.url).toBe(
        'http://localhost:3000/auth/exchange?t=token-abc',
      );

      expect(tokens.attachTelegramMessage).toHaveBeenCalledWith(
        'token-abc',
        BigInt(99),
        100,
        7,
      );
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
      const { update } = buildUpdate({ fromContext: jest.fn(() => null) });
      const ctx = buildCtx('en');

      await update.onLogin(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        'translated:telegram.errors.no_profile',
      );
      expect(ctx.replyWithPhoto).not.toHaveBeenCalled();
    });
  });
});
