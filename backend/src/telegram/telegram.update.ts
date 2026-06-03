import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';

import { TelegramAdapter } from '../auth/channel/telegram-adapter';
import { IdentityService } from '../auth/identity.service';
import { TokenService } from '../auth/token.service';
import { frontendConfig } from '../config/frontend.config';
import { telegramConfig } from '../config/telegram.config';
import { resolveLang } from './telegram-i18n';

const MINI_APP_PATH = '/app';

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
    // The bot exposes no slash commands — clear any previously registered menu.
    await this.bot.telegram.setMyCommands([]);

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
   * Reply with a short welcome message and a single button that opens the app.
   * Telegram rejects `web_app` buttons whose URL is not HTTPS, so fall back to
   * a plain URL button (opening the app in a browser) when no HTTPS URL exists.
   */
  private async sendOpenApp(ctx: Context): Promise<void> {
    const miniAppUrl = this.miniAppUrl;
    const button = miniAppUrl.startsWith('https://')
      ? Markup.button.webApp(this.t(ctx, 'telegram.open.button'), miniAppUrl)
      : Markup.button.url(
          this.t(ctx, 'telegram.open.button'),
          this.frontend.publicAppUrl,
        );

    await ctx.reply(this.t(ctx, 'telegram.open.caption'), {
      reply_markup: Markup.inlineKeyboard([[button]]).reply_markup,
    });
  }
}
