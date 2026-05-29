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
import { Context, Telegraf } from 'telegraf';

import { TelegramAdapter } from '../auth/channel/telegram-adapter';
import { IdentityService } from '../auth/identity.service';
import { TokenService } from '../auth/token.service';
import { frontendConfig } from '../config/frontend.config';
import { StickerQueueService } from '../queue/sticker.queue';
import { resolveLang } from './telegram-i18n';

const LOGO_PATH = resolve(process.cwd(), '../frontend/public/logo.png');

@Update()
@Injectable()
export class TelegramUpdate implements OnModuleInit {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    @Inject(frontendConfig.KEY)
    private readonly frontend: ConfigType<typeof frontendConfig>,
    private readonly telegramAdapter: TelegramAdapter,
    private readonly identity: IdentityService,
    private readonly tokens: TokenService,
    private readonly stickerQueue: StickerQueueService,
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

  async onModuleInit(): Promise<void> {
    await this.bot.telegram.setMyCommands([
      { command: 'login', description: 'Log in to the app' },
      { command: 'receive', description: 'Generate a sticker pack' },
      { command: 'open', description: 'Open the frontend' },
    ]);
  }

  @Command('open')
  async onOpen(@Ctx() ctx: Context): Promise<void> {
    const url = this.frontend.publicAppUrl;
    await ctx.reply(url, {
      reply_markup: {
        inline_keyboard: [[{ text: this.t(ctx, 'telegram.open.button'), url }]],
      },
    });
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

    await this.sendLoginLink(ctx, 'start');
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

  @Command('login')
  async onLogin(@Ctx() ctx: Context): Promise<void> {
    await this.sendLoginLink(ctx, 'login');
  }

  private async sendLoginLink(
    ctx: Context,
    source: 'start' | 'login',
  ): Promise<void> {
    const event = await this.telegramAdapter.fromContext(ctx);
    if (!event) {
      await ctx.reply(this.t(ctx, 'telegram.errors.no_profile'));
      return;
    }

    const userMessageId = ctx.message?.message_id ?? null;

    const { userId } = await this.identity.resolveOrCreate(event);
    // Note: `created` flag is available here if attribution is needed in the
    // Telegram flow. Currently Telegram-channel registration is not attributed
    // via web-cookie referrals (no web cookie context in the bot).
    const token = await this.tokens.mint(userId, 'telegram');
    const url = `${this.frontend.publicAppUrl}/auth/exchange?t=${token}`;
    this.logger.log(
      `/${source} -> issued login token for user ${userId} via telegram`,
    );

    const caption = this.t(ctx, 'telegram.login.caption');
    const replyMarkup = {
      inline_keyboard: [[{ text: this.t(ctx, 'telegram.login.button'), url }]],
    };

    // The logo lives in the frontend package, which may not be present next to
    // the backend in production/Docker. Never let a missing/unreadable file
    // block the login link — fall back to a plain text reply with the button.
    let sent: { chat: { id: number }; message_id: number };
    try {
      sent = await ctx.replyWithPhoto(
        { source: LOGO_PATH },
        { caption, reply_markup: replyMarkup },
      );
    } catch (err) {
      this.logger.warn(
        `replyWithPhoto failed (${err instanceof Error ? err.message : String(err)}); sending text login link instead`,
      );
      sent = await ctx.reply(caption, { reply_markup: replyMarkup });
    }

    await this.tokens.attachTelegramMessage(
      token,
      BigInt(sent.chat.id),
      sent.message_id,
      userMessageId,
    );

    // +5 s buffer so the auth-exchange path wins the race when the user clicks right at expiry
    const timer = setTimeout(
      () => {
        this.bot.telegram
          .editMessageReplyMarkup(
            sent.chat.id,
            sent.message_id,
            undefined,
            undefined,
          )
          .catch(() => {});
      },
      5 * 60 * 1000 + 5_000,
    );
    timer.unref();
  }

  @Command('receive')
  async onReceive(@Ctx() ctx: Context): Promise<void> {
    const fromId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    if (fromId === undefined || chatId === undefined) {
      await ctx.reply(this.t(ctx, 'telegram.errors.no_chat_info'));
      return;
    }

    await this.stickerQueue.enqueue({
      channelUserId: String(fromId),
      chatId,
      prompt: 'sticker pack',
    });

    await ctx.reply(this.t(ctx, 'telegram.queue.working_on_it'));
  }
}
