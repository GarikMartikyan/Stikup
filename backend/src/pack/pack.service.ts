import { join } from 'node:path';

import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Input, Telegraf } from 'telegraf';

import { PrismaService } from '../prisma/prisma.service';

const FREE_STICKER_DIR = join(__dirname, '..', '..', 'public', 'free-stickers');
const FREE_STICKER_FILES = [
  'sticker_1.webp',
  'sticker_2.webp',
  'sticker_3.webp',
];

@Injectable()
export class PackService {
  private readonly logger = new Logger(PackService.name);
  private cachedBotUsername: string | null = null;

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly prisma: PrismaService,
  ) {}

  async claimFreeStickers(
    userId: string,
  ): Promise<{ delivered: boolean; botUrl: string }> {
    const botUrl = await this.getBotUrl();

    const identity = await this.prisma.channelIdentity.findFirst({
      where: { userId, channel: 'telegram' },
      select: { channelUserId: true },
    });

    if (!identity) {
      this.logger.log(
        `claim-free: user ${userId} has no telegram identity; redirecting to /start`,
      );
      return { delivered: false, botUrl };
    }

    const chatId = Number(identity.channelUserId);
    for (const filename of FREE_STICKER_FILES) {
      const path = join(FREE_STICKER_DIR, filename);
      await this.bot.telegram.sendSticker(chatId, Input.fromLocalFile(path));
    }
    this.logger.log(
      `claim-free: sent ${FREE_STICKER_FILES.length} stickers to telegram chat ${chatId}`,
    );

    return { delivered: true, botUrl };
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
