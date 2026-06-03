import { ConflictException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { I18nService } from 'nestjs-i18n';
import type { Context, Telegraf } from 'telegraf';

import type { TelegramAdapter } from '../../auth/channel/telegram-adapter';
import type { frontendConfig } from '../../config/frontend.config';
import type { telegramConfig } from '../../config/telegram.config';
import type { IdentityService } from '../../auth/identity.service';
import type { PackService } from '../../pack/pack.service';
import type { TokenService } from '../../auth/token.service';
import { TelegramUpdate } from '../telegram.update';

function buildUpdate(overrides?: {
  fromContext?: jest.Mock;
  miniAppUrl?: string;
  listPacks?: jest.Mock;
  deliverTelegram?: jest.Mock;
}): {
  update: TelegramUpdate;
  bot: { telegram: Record<string, jest.Mock> };
  i18n: { t: jest.Mock };
  tokens: {
    consumeLink: jest.Mock;
  };
  identity: { resolveOrCreate: jest.Mock; linkChannel: jest.Mock };
  packs: { listPacks: jest.Mock; deliverTelegram: jest.Mock };
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
    consumeLink: jest.fn(() => Promise.resolve(null)),
  };

  const packs = {
    listPacks: overrides?.listPacks ?? jest.fn(() => Promise.resolve([])),
    deliverTelegram:
      overrides?.deliverTelegram ??
      jest.fn(() => Promise.resolve({ delivered: true })),
  };

  // Stand-in for nestjs-i18n: echo the key so we can assert it was translated.
  const i18n = { t: jest.fn((key: string) => `translated:${key}`) };

  const update = new TelegramUpdate(
    bot,
    frontend,
    telegramCfg,
    telegramAdapter,
    identity as unknown as IdentityService,
    tokens as unknown as TokenService,
    packs as unknown as PackService,
    i18n as unknown as I18nService,
  );

  return {
    update,
    bot: bot as unknown as { telegram: Record<string, jest.Mock> },
    i18n,
    tokens,
    identity,
    packs,
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
    it('registers the /receive command and sets the menu button when miniAppUrl is HTTPS', async () => {
      const { update, bot } = buildUpdate({
        miniAppUrl: 'https://stikup.app/app',
      });

      await update.onModuleInit();

      expect(bot.telegram.setMyCommands).toHaveBeenCalledWith([
        { command: 'receive', description: 'Get my sticker packs' },
      ]);
      expect(bot.telegram.setChatMenuButton).toHaveBeenCalledWith({
        menuButton: {
          type: 'web_app',
          text: 'Open StikUp',
          web_app: { url: 'https://stikup.app/app' },
        },
      });
    });

    it('sets the menu button with the derived http URL when miniAppUrl is unset', async () => {
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

  describe('/start without payload', () => {
    it('replies with the open caption and a plain-URL open button in non-HTTPS dev', async () => {
      const { update, i18n } = buildUpdate();
      const ctx = buildCtx('en', '/start');

      await update.onStart(ctx);

      expect(i18n.t).toHaveBeenCalledWith('telegram.open.caption', {
        lang: 'en',
        args: undefined,
      });

      const [text, extra] = ctx.reply.mock.calls[0];
      expect(text).toBe('translated:telegram.open.caption');

      const row = extra.reply_markup.inline_keyboard[0];
      expect(row).toHaveLength(1);
      expect(row[0].text).toBe('translated:telegram.open.button');
      // Non-HTTPS dev: plain URL button to the public app, no web_app button.
      expect(row[0].url).toBe('http://localhost:3000');
      expect(row[0].web_app).toBeUndefined();
      // No login token is minted and no photo is sent.
      expect(ctx.replyWithPhoto).not.toHaveBeenCalled();
    });

    it('uses a web_app Mini App button when miniAppUrl is HTTPS', async () => {
      const { update } = buildUpdate({ miniAppUrl: 'https://stikup.app/app' });
      const ctx = buildCtx('en', '/start');

      await update.onStart(ctx);

      const [, extra] = ctx.reply.mock.calls[0];
      const button = extra.reply_markup.inline_keyboard[0][0];
      expect(button.text).toBe('translated:telegram.open.button');
      expect(button.web_app).toBeDefined();
      expect(button.web_app.url).toBe('https://stikup.app/app');
    });

    it('resolves Russian clients to the ru locale', async () => {
      const { update, i18n } = buildUpdate();
      const ctx = buildCtx('ru-RU', '/start');

      await update.onStart(ctx);

      expect(i18n.t).toHaveBeenCalledWith('telegram.open.caption', {
        lang: 'ru',
        args: undefined,
      });
    });
  });

  describe('/receive', () => {
    it('replies with no_profile when the Telegram profile cannot be read', async () => {
      const { update, packs } = buildUpdate({
        fromContext: jest.fn(() => Promise.resolve(null)),
      });
      const ctx = buildCtx('en');

      await update.onReceive(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        'translated:telegram.errors.no_profile',
      );
      expect(packs.listPacks).not.toHaveBeenCalled();
    });

    it('replies that there are no packs when the user has none ready', async () => {
      const { update, packs } = buildUpdate({
        listPacks: jest.fn(() =>
          Promise.resolve([
            { id: 'p1', status: 'generating' },
            { id: 'p2', status: 'failed' },
          ]),
        ),
      });
      const ctx = buildCtx('en');

      await update.onReceive(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        'translated:telegram.receive.none',
      );
      expect(packs.deliverTelegram).not.toHaveBeenCalled();
    });

    it('delivers every ready pack oldest-first via deliverTelegram', async () => {
      const deliverTelegram = jest.fn(
        (packId: string): Promise<{ delivered: boolean }> => {
          void packId;
          return Promise.resolve({ delivered: true });
        },
      );
      const { update } = buildUpdate({
        // listPacks returns newest-first (createdAt desc).
        listPacks: jest.fn(() =>
          Promise.resolve([
            { id: 'new', status: 'ready' },
            { id: 'mid', status: 'generating' },
            { id: 'old', status: 'ready' },
          ]),
        ),
        deliverTelegram,
      });
      const ctx = buildCtx('en');

      await update.onReceive(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        'translated:telegram.receive.working',
      );
      // Only the two ready packs, delivered oldest-first.
      expect(deliverTelegram.mock.calls.map((c) => c[0])).toEqual([
        'old',
        'new',
      ]);
      expect(deliverTelegram).toHaveBeenCalledWith('old', 'user-1');
    });

    it('replies with a failure message when no pack could be delivered', async () => {
      const { update } = buildUpdate({
        listPacks: jest.fn(() =>
          Promise.resolve([{ id: 'p1', status: 'ready' }]),
        ),
        deliverTelegram: jest.fn(() => Promise.reject(new Error('boom'))),
      });
      const ctx = buildCtx('en');

      await update.onReceive(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        'translated:telegram.receive.failed',
      );
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
  });
});
