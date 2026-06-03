import { resolve } from 'node:path';

import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { Command, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';

import { TelegramAdapter } from '../auth/channel/telegram-adapter';
import { IdentityService } from '../auth/identity.service';
import { TokenService } from '../auth/token.service';
import { frontendConfig } from '../config/frontend.config';
import { telegramConfig } from '../config/telegram.config';
import { PackService } from '../pack/pack.service';
import { resolveLang } from './telegram-i18n';

const MINI_APP_PATH = '/app';

// Vendored into the backend package (backend/assets) so it ships inside the
// backend Docker image — `node dist/main.js` runs with cwd = the backend root.
const LOGO_PATH = resolve(process.cwd(), 'assets/logo.png');

@Update()
@Injectable()
export class TelegramUpdate implements OnModuleInit {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    @Inject(frontendConfig.KEY)
    private readonly frontend: ConfigType<typeof frontendConfig>,
    @Inject(telegramConfig.KEY)
    private readonly telegramCfg: ConfigType<typeof telegramConfig>,
    private readonly telegramAdapter: TelegramAdapter,
    private readonly identity: IdentityService,
    private readonly tokens: TokenService,
    private readonly packs: PackService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Translate a key for the locale implied by the sender's Telegram client.
   *
   * We resolve the language here rather than relying on a Telegraf context
   * helper: nestjs-telegraf attaches `@Composer()` middleware to the Telegraf
   * Stage, whose middleware only runs when `ctx.session` exists. This bot has
   * no session middleware, so any context-attached `t()` would never be set.
   */
  private t(ctx: Context, key: string, args?: Record<string, unknown>): string {
    const lang = resolveLang(ctx.from?.language_code);
    return this.i18n.t(key, { lang, args });
  }

  private get miniAppUrl(): string {
    return (
      this.telegramCfg.miniAppUrl ??
      `${this.frontend.publicAppUrl}${MINI_APP_PATH}`
    );
  }

  async onModuleInit(): Promise<void> {
    await this.bot.telegram.setMyCommands([
      { command: 'receive', description: 'Get my sticker packs' },
    ]);

    // Set the persistent ☰ menu button to open the Mini App.
    // Best-effort: a missing HTTPS URL in dev or any transient API error
    // must not prevent the bot from starting.
    try {
      await this.bot.telegram.setChatMenuButton({
        menuButton: {
          type: 'web_app',
          text: 'Open StikUp',
          web_app: { url: this.miniAppUrl },
        },
      });
    } catch (err) {
      this.logger.warn(
        `setChatMenuButton failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    this.logger.log(
      `/start from telegram user ${ctx.from?.id ?? 'unknown'} language_code=${ctx.from?.language_code ?? 'unknown'}`,
    );

    // Parse the deep-link payload from the message text (format: "/start <payload>").
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const parts = text.split(' ');
    const payload = parts.length > 1 ? parts[1] : '';

    if (payload.startsWith('link_')) {
      await this.handleLinkPayload(ctx, payload.slice('link_'.length));
      return;
    }

    await this.sendOpenApp(ctx);
  }

  /**
   * Re-send the user every sticker pack they've created. Each ready pack is
   * delivered as a Telegram sticker set (via the same flow as the in-app "get
   * stickers" action), so the user receives an "Add stickers" link per pack.
   */
  @Command('receive')
  async onReceive(@Ctx() ctx: Context): Promise<void> {
    const event = await this.telegramAdapter.fromContext(ctx);
    if (!event) {
      await ctx.reply(this.t(ctx, 'telegram.errors.no_profile'));
      return;
    }

    const { userId } = await this.identity.resolveOrCreate(event);

    const packs = await this.packs.listPacks(userId);
    const ready = packs.filter((pack) => pack.status === 'ready');

    this.logger.log(
      `/receive: user ${userId} has ${ready.length}/${packs.length} ready pack(s)`,
    );

    if (ready.length === 0) {
      await ctx.reply(this.t(ctx, 'telegram.receive.none'));
      return;
    }

    await ctx.reply(this.t(ctx, 'telegram.receive.working'));

    // Deliver oldest-first so the set links arrive in creation order. Each
    // deliverTelegram() call sends its own "Add it to Telegram: <link>" message.
    let delivered = 0;
    for (const pack of [...ready].reverse()) {
      try {
        const result = await this.packs.deliverTelegram(pack.id, userId);
        if (result.delivered) delivered += 1;
      } catch (err) {
        this.logger.warn(
          `/receive: deliverTelegram failed for pack ${pack.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (delivered === 0) {
      await ctx.reply(this.t(ctx, 'telegram.receive.failed'));
    }
  }

  private async handleLinkPayload(ctx: Context, token: string): Promise<void> {
    const link = await this.tokens.consumeLink(token);
    if (!link) {
      await ctx.reply(this.t(ctx, 'telegram.link.expired'));
      return;
    }

    const event = await this.telegramAdapter.fromContext(ctx);
    if (!event) {
      await ctx.reply(this.t(ctx, 'telegram.errors.no_profile'));
      return;
    }

    try {
      await this.identity.linkChannel(link.userId, event);
      await ctx.reply(this.t(ctx, 'telegram.link.success'));
    } catch (err) {
      if (err instanceof ConflictException) {
        await ctx.reply(this.t(ctx, 'telegram.link.conflict'));
      } else {
        this.logger.error(
          `linkChannel failed for userId=${link.userId}: ${err instanceof Error ? err.message : String(err)}`,
        );
        await ctx.reply(this.t(ctx, 'telegram.link.failed'));
      }
    }
  }

  /**
   * Reply with the logo, a short welcome caption, and a single button that
   * opens the app. Telegram rejects `web_app` buttons whose URL is not HTTPS,
   * so fall back to a plain URL button (opening the app in a browser) when no
   * HTTPS URL exists.
   */
  private async sendOpenApp(ctx: Context): Promise<void> {
    const miniAppUrl = this.miniAppUrl;
    const button = miniAppUrl.startsWith('https://')
      ? Markup.button.webApp(this.t(ctx, 'telegram.open.button'), miniAppUrl)
      : Markup.button.url(
          this.t(ctx, 'telegram.open.button'),
          this.frontend.publicAppUrl,
        );

    const caption = this.t(ctx, 'telegram.open.caption');
    const replyMarkup = Markup.inlineKeyboard([[button]]).reply_markup;

    // Lead with the logo. Best-effort: should the asset ever be missing or
    // unreadable, never let it block the welcome — fall back to a text reply.
    try {
      await ctx.replyWithPhoto(
        { source: LOGO_PATH },
        { caption, reply_markup: replyMarkup },
      );
    } catch (err) {
      this.logger.warn(
        `replyWithPhoto failed (${err instanceof Error ? err.message : String(err)}); sending text welcome instead`,
      );
      await ctx.reply(caption, { reply_markup: replyMarkup });
    }
  }
}
