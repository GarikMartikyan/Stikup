import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Input, Telegraf } from 'telegraf';

import { PrismaService } from '../prisma/prisma.service';

const FREE_STICKER_DIR = join(__dirname, '..', '..', 'public', 'free-stickers');
const FREE_STICKER_MANIFEST = join(FREE_STICKER_DIR, 'manifest.json');

interface FreeStickerManifest {
  stickers: string[];
}

export interface ClaimFreeResult {
  delivered: boolean;
  botUrl: string;
  alreadyClaimed?: boolean;
}

@Injectable()
export class PackService {
  private readonly logger = new Logger(PackService.name);
  private cachedBotUsername: string | null = null;
  // Lazily loaded so a malformed manifest fails on use, not on module init.
  private cachedStickerFiles: string[] | null = null;

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly prisma: PrismaService,
  ) {}

  async claimFreeStickers(
    packId: string,
    userId: string,
  ): Promise<ClaimFreeResult> {
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

    // Insert the claim first; if a row already exists, short-circuit before
    // sending stickers so double-tap / retry doesn't re-deliver the pack.
    try {
      await this.prisma.packClaim.create({
        data: { packId, userId, channel: 'telegram' },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        this.logger.log(
          `claim-free: pack ${packId} already claimed by user ${userId}; skipping resend`,
        );
        return { delivered: false, botUrl, alreadyClaimed: true };
      }
      throw err;
    }

    const stickers = this.getFreeStickerFiles();
    const chatId = Number(identity.channelUserId);
    for (const filename of stickers) {
      const path = join(FREE_STICKER_DIR, filename);
      await this.bot.telegram.sendSticker(chatId, Input.fromLocalFile(path));
    }
    this.logger.log(
      `claim-free: sent ${stickers.length} stickers to telegram chat ${chatId}`,
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

  private getFreeStickerFiles(): string[] {
    if (this.cachedStickerFiles) return this.cachedStickerFiles;

    let raw: string;
    try {
      raw = readFileSync(FREE_STICKER_MANIFEST, 'utf8');
    } catch (err) {
      throw new Error(
        `Free sticker manifest not found at ${FREE_STICKER_MANIFEST}: ${(err as Error).message}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `Free sticker manifest is not valid JSON: ${(err as Error).message}`,
      );
    }

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray((parsed as FreeStickerManifest).stickers) ||
      !(parsed as FreeStickerManifest).stickers.every(
        (s) => typeof s === 'string',
      )
    ) {
      throw new Error(
        `Free sticker manifest is malformed: expected { stickers: string[] } at ${FREE_STICKER_MANIFEST}`,
      );
    }

    this.cachedStickerFiles = (parsed as FreeStickerManifest).stickers;
    return this.cachedStickerFiles;
  }
}
