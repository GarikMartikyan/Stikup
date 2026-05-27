import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BOT_SENDER, type BotSender } from '../auth/channel/bot-sender';
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
  // Lazily loaded so a malformed manifest fails on use, not on module init.
  private cachedStickerFiles: string[] | null = null;

  constructor(
    @Inject(BOT_SENDER) private readonly botSender: BotSender,
    private readonly prisma: PrismaService,
  ) {}

  async claimFreeStickers(
    packId: string,
    userId: string,
  ): Promise<ClaimFreeResult> {
    const botUrl = await this.botSender.getBotUrl();

    const identity = await this.prisma.channelIdentity.findFirst({
      where: { userId, channel: this.botSender.channel },
      select: { channelUserId: true, channel: true },
    });

    if (!identity) {
      this.logger.log(
        `claim-free: user ${userId} has no ${this.botSender.channel} identity; redirecting to /start`,
      );
      return { delivered: false, botUrl };
    }

    if (identity.channel !== this.botSender.channel) {
      this.logger.log(
        `claim-free: identity channel ${identity.channel} does not match sender ${this.botSender.channel}; skipping`,
      );
      return { delivered: false, botUrl };
    }

    // Insert the claim first; if a row already exists, short-circuit before
    // sending stickers so double-tap / retry doesn't re-deliver the pack.
    try {
      await this.prisma.packClaim.create({
        data: { packId, userId, channel: this.botSender.channel },
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
    for (const filename of stickers) {
      const path = join(FREE_STICKER_DIR, filename);
      await this.botSender.sendSticker(identity.channelUserId, path);
    }
    this.logger.log(
      `claim-free: sent ${stickers.length} stickers to ${this.botSender.channel} user ${identity.channelUserId}`,
    );

    return { delivered: true, botUrl };
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
