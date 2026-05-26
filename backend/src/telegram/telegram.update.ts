import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { TelegramAdapter } from '../auth/channel/telegram-adapter';
import { IdentityService } from '../auth/identity.service';
import { TokenService } from '../auth/token.service';
import { AppConfigService } from '../config/app-config.service';

@Update()
@Injectable()
export class TelegramUpdate implements OnModuleInit {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly appConfig: AppConfigService,
    private readonly telegramAdapter: TelegramAdapter,
    private readonly identity: IdentityService,
    private readonly tokens: TokenService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Log in to the app' },
    ]);
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
    const url = `${this.appConfig.publicAppUrl}/auth/exchange?t=${token}`;
    this.logger.log(
      `/start -> issued login token for user ${userId} via telegram`,
    );

    await ctx.reply('Tap the button to log in. The link is valid for 5 minutes.', {
      reply_markup: { inline_keyboard: [[{ text: 'Log in', url }]] },
    });
  }
}
