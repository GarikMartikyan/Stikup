import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Input, Telegraf } from 'telegraf';

import type { BotSender } from './bot-sender';

@Injectable()
export class TelegramBotSender implements BotSender {
  readonly channel = 'telegram' as const;
  private cachedBotUsername: string | null = null;

  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async sendSticker(channelUserId: string, filePath: string): Promise<void> {
    const chatId = Number(channelUserId);
    await this.bot.telegram.sendSticker(chatId, Input.fromLocalFile(filePath));
  }

  async sendMessage(channelUserId: string, text: string): Promise<void> {
    const chatId = Number(channelUserId);
    await this.bot.telegram.sendMessage(chatId, text);
  }

  async getBotUrl(): Promise<string> {
    const username = await this.getBotUsername();
    return `https://t.me/${username}`;
  }

  private async getBotUsername(): Promise<string> {
    if (this.cachedBotUsername) return this.cachedBotUsername;
    const me = await this.bot.telegram.getMe();
    if (!me.username) {
      throw new Error('Telegram bot has no username configured');
    }
    this.cachedBotUsername = me.username;
    return me.username;
  }
}
