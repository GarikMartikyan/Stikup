import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Command, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { TelegramAdapter } from '../auth/channel/telegram-adapter';
import { IdentityService } from '../auth/identity.service';
import { TokenService } from '../auth/token.service';
import { frontendConfig } from '../config/frontend.config';
import { StickerQueueService } from '../queue/sticker.queue';

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
  ) {}

  async onModuleInit(): Promise<void> {
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Log in to the app' },
      { command: 'receive', description: 'Generate a sticker pack' },
      { command: 'open', description: 'Open the frontend' },
    ]);
  }

  @Command('open')
  async onOpen(@Ctx() ctx: Context): Promise<void> {
    const url = this.frontend.publicAppUrl;
    await ctx.reply(url, {
      reply_markup: { inline_keyboard: [[{ text: 'Open', url }]] },
    });
  }

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    const event = this.telegramAdapter.fromContext(ctx);
    if (!event) {
      await ctx.reply("Sorry, I couldn't read your Telegram profile.");
      return;
    }

    const { userId } = await this.identity.resolveOrCreate(event);
    const token = await this.tokens.mint(userId, 'telegram');
    const url = `${this.frontend.publicAppUrl}/auth/exchange?t=${token}`;
    this.logger.log(
      `/start -> issued login token for user ${userId} via telegram`,
    );

    await ctx.reply(
      'Tap the button to log in. The link is valid for 5 minutes.',
      {
        reply_markup: { inline_keyboard: [[{ text: 'Log in', url }]] },
      },
    );
  }

  @Command('receive')
  async onReceive(@Ctx() ctx: Context): Promise<void> {
    const fromId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    if (fromId === undefined || chatId === undefined) {
      await ctx.reply("Sorry, I couldn't read your chat info.");
      return;
    }

    await this.stickerQueue.enqueue({
      channelUserId: String(fromId),
      chatId,
      prompt: 'sticker pack',
    });

    await ctx.reply(
      "⏳ Working on it. I'll send the stickers as soon as they're ready.",
    );
  }
}
