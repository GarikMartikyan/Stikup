import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import { BOT_SENDER, type BotSender } from '../auth/channel/bot-sender';
import { offerConfig } from '../config/offer.config';
import { PrismaService } from '../prisma/prisma.service';

const FREE_STICKER_DIR = join(__dirname, '..', '..', 'public', 'free-stickers');
const FREE_STICKER_MANIFEST = join(FREE_STICKER_DIR, 'manifest.json');
const PLACEHOLDER_DIR = join(
  __dirname,
  '..',
  '..',
  'public',
  'sticker-placeholders',
);

/** Artificial delay to simulate AI generation (ms). */
const SIMULATED_GENERATION_DELAY_MS = 700;

interface FreeStickerManifest {
  stickers: string[];
}

export interface ClaimFreeResult {
  delivered: boolean;
  botUrl: string;
  alreadyClaimed?: boolean;
}

export interface DeliverTelegramResult {
  delivered: boolean;
  botUrl: string;
  alreadyClaimed?: boolean;
  needsTelegram?: boolean;
}

export interface PackDetail {
  id: string;
  status: string;
  unlocked: boolean;
  freeCount: number;
  packSize: number;
  regensLeft: number;
  stickers: Array<{ index: number; url: string }>;
}

export interface PackSummary {
  id: string;
  createdAt: string;
  status: string;
  unlocked: boolean;
  freeCount: number;
  packSize: number;
  stickers: Array<{ index: number; url: string }>;
}

@Injectable()
export class PackService {
  private readonly logger = new Logger(PackService.name);
  // Lazily loaded so a malformed manifest fails on use, not on module init.
  private cachedStickerFiles: string[] | null = null;

  constructor(
    @Inject(BOT_SENDER) private readonly botSender: BotSender,
    private readonly prisma: PrismaService,
    @Inject(offerConfig.KEY)
    private readonly offer: ConfigType<typeof offerConfig>,
  ) {}

  async generatePack(userId: string): Promise<{ packId: string }> {
    // Simulate AI generation delay before entering the transaction so the DB
    // connection is not held open during the wait.
    await new Promise((resolve) =>
      setTimeout(resolve, SIMULATED_GENERATION_DELAY_MS),
    );

    const packSize = this.offer.packSize;
    const maxGenerations = 1 + this.offer.freeRegenerations;

    const pack = await this.prisma.$transaction(async (tx) => {
      // Lock the user row so concurrent POST /packs requests serialize and
      // cannot both pass the quota check at the same time.
      const rows = await tx.$queryRaw<Array<{ generations_used: number }>>`
        SELECT generations_used FROM users WHERE id = ${userId}::uuid FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new Error(`user ${userId} not found`);
      }

      if (rows[0].generations_used >= maxGenerations) {
        throw new ForbiddenException('generation_limit_reached');
      }

      await tx.user.update({
        where: { id: userId },
        data: { generationsUsed: { increment: 1 } },
      });

      return tx.pack.create({
        data: {
          userId,
          status: 'ready',
          stickers: {
            create: Array.from({ length: packSize }, (_, i) => ({
              index: i,
              url: `/assets/sticker_${i + 1}.webp`,
            })),
          },
        },
        select: { id: true },
      });
    });

    this.logger.log(
      `generated pack ${pack.id} for user ${userId} with ${packSize} stickers`,
    );
    return { packId: pack.id };
  }

  async listPacks(userId: string): Promise<PackSummary[]> {
    const packs = await this.prisma.pack.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        stickers: {
          select: { index: true, url: true },
          orderBy: { index: 'asc' },
        },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullPackUnlockedAt: true },
    });
    const unlocked = user?.fullPackUnlockedAt != null;

    return packs.map((pack) => ({
      id: pack.id,
      createdAt: pack.createdAt.toISOString(),
      status: pack.status,
      unlocked,
      freeCount: this.offer.freeStickerCount,
      packSize: this.offer.packSize,
      stickers: pack.stickers,
    }));
  }

  async getPack(packId: string, userId: string): Promise<PackDetail | null> {
    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
      select: {
        id: true,
        status: true,
        userId: true,
        stickers: {
          select: { index: true, url: true },
          orderBy: { index: 'asc' },
        },
      },
    });

    if (!pack || pack.userId !== userId) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullPackUnlockedAt: true, generationsUsed: true },
    });

    const maxGenerations = 1 + this.offer.freeRegenerations;

    return {
      id: pack.id,
      status: pack.status,
      unlocked: user?.fullPackUnlockedAt != null,
      freeCount: this.offer.freeStickerCount,
      packSize: this.offer.packSize,
      regensLeft: Math.max(0, maxGenerations - (user?.generationsUsed ?? 0)),
      stickers: pack.stickers,
    };
  }

  async deletePack(packId: string, userId: string): Promise<boolean> {
    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
      select: { userId: true },
    });
    if (!pack || pack.userId !== userId) return false;

    await this.prisma.pack.delete({ where: { id: packId } });
    this.logger.log(`deleted pack ${packId} for user ${userId}`);
    return true;
  }

  async deliverTelegram(
    packId: string,
    userId: string,
  ): Promise<DeliverTelegramResult> {
    const botUrl = await this.botSender.getBotUrl();

    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
      select: { userId: true },
    });
    if (!pack || pack.userId !== userId) return { delivered: false, botUrl };

    const identity = await this.prisma.channelIdentity.findFirst({
      where: { userId, channel: this.botSender.channel },
      select: { channelUserId: true },
    });

    if (!identity) {
      this.logger.log(
        `deliver-telegram: user ${userId} has no ${this.botSender.channel} identity`,
      );
      return { delivered: false, botUrl, needsTelegram: true };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullPackUnlockedAt: true },
    });
    const unlocked = user?.fullPackUnlockedAt != null;
    const count = unlocked ? this.offer.packSize : this.offer.freeStickerCount;

    // Insert claim first to guard against double-delivery.
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
          `deliver-telegram: pack ${packId} already claimed by user ${userId}`,
        );
        return { delivered: false, botUrl, alreadyClaimed: true };
      }
      throw err;
    }

    // Send N sticker files.
    const files = this.getPlaceholderFiles(count);
    if (files.length === 0) {
      this.logger.warn(
        `deliver-telegram: no placeholder files found in ${PLACEHOLDER_DIR}; aborting delivery`,
      );
      // Roll back claim so the user can retry once files are available.
      await this.prisma.packClaim.delete({
        where: { packId_userId: { packId, userId } },
      });
      return { delivered: false, botUrl };
    }

    // If any send fails mid-loop, roll back the claim this call inserted so
    // the user can retry and receive a complete delivery rather than getting
    // stuck on `alreadyClaimed: true` forever.
    try {
      for (const filePath of files) {
        await this.botSender.sendSticker(identity.channelUserId, filePath);
      }
    } catch (err) {
      this.logger.warn(
        `deliver-telegram: sendSticker failed for user ${userId}, rolling back claim: ${err instanceof Error ? err.message : String(err)}`,
      );
      await this.prisma.packClaim.delete({
        where: { packId_userId: { packId, userId } },
      });
      return { delivered: false, botUrl };
    }

    this.logger.log(
      `deliver-telegram: sent ${files.length} stickers to ${this.botSender.channel} user ${identity.channelUserId}`,
    );

    return { delivered: true, botUrl };
  }

  async claimFreeStickers(
    packId: string,
    userId: string,
  ): Promise<ClaimFreeResult> {
    const botUrl = await this.botSender.getBotUrl();

    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
      select: { userId: true },
    });
    if (!pack || pack.userId !== userId) {
      this.logger.log(
        `claim-free: pack ${packId} not found or not owned by user ${userId}`,
      );
      return { delivered: false, botUrl };
    }

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

  private getPlaceholderFiles(count: number): string[] {
    const files: string[] = [];
    for (let i = 1; i <= count; i++) {
      const filePath = join(PLACEHOLDER_DIR, `sticker_${i}.webp`);
      if (existsSync(filePath)) {
        files.push(filePath);
      } else {
        this.logger.warn(`placeholder file missing: ${filePath}`);
      }
    }
    return files;
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
