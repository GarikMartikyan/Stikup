import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Command, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Input, Telegraf } from 'telegraf';

import { TelegramAdapter } from '../auth/channel/telegram-adapter';
import { IdentityService } from '../auth/identity.service';
import { TokenService } from '../auth/token.service';
import { frontendConfig } from '../config/frontend.config';
import { ImageProcessingService } from '../image-processing/image-processing.service';

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
    private readonly imageProcessing: ImageProcessingService,
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
    const status = await ctx.reply('⏳ Processing');
    const frames = [
      '⏳ Processing',
      '⌛ Processing.',
      '⏳ Processing..',
      '⌛ Processing...',
    ];
    let frame = 1;
    const tick = setInterval(() => {
      void ctx.telegram
        .editMessageText(
          status.chat.id,
          status.message_id,
          undefined,
          frames[frame % frames.length],
        )
        .catch(() => {
          // Ignore: a "message is not modified" race or rate-limit hiccup
          // shouldn't break the pipeline.
        });
      frame += 1;
    }, 800);

    try {
      const { stickerPaths, cleanup } =
        await this.imageProcessing.generateStickers(
          Buffer.alloc(0),
          'sticker pack',
        );

      try {
        clearInterval(tick);
        await ctx.telegram
          .deleteMessage(status.chat.id, status.message_id)
          .catch(() => undefined);

        if (stickerPaths.length === 0) {
          await ctx.reply('No stickers were produced.');
          return;
        }

        for (const stickerPath of stickerPaths) {
          await ctx.replyWithSticker(Input.fromLocalFile(stickerPath));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`/receive failed: ${message}`);
        await ctx.reply(`Failed to generate stickers: ${message}`);
      } finally {
        await cleanup();
      }
    } catch (err) {
      clearInterval(tick);
      await ctx.telegram
        .deleteMessage(status.chat.id, status.message_id)
        .catch(() => undefined);
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`/receive failed: ${message}`);
      await ctx.reply(`Failed to generate stickers: ${message}`);
    }
  }
}
