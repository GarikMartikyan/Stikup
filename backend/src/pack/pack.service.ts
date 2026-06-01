import { readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import { BOT_SENDER, type BotSender } from '../auth/channel/bot-sender';
import { TelegramStickerService } from '../auth/channel/telegram-sticker.service';
import { offerConfig } from '../config/offer.config';
import { storageConfig } from '../config/storage.config';
import { PrismaService } from '../prisma/prisma.service';
import { StickerQueueService } from '../queue/sticker.queue';
import { getPlaceholderFiles } from './sticker-assets';

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

export interface DeliverTelegramResult {
  delivered: boolean;
  botUrl: string;
  needsTelegram?: boolean;
  stickerSetUrl?: string;
}

export interface MarkDownloadedResult {
  locked: boolean;
}

export interface PackDetail {
  id: string;
  status: string;
  unlocked: boolean;
  /** The user has accepted a pack (got/downloaded/unlocked) — generation is locked. */
  locked: boolean;
  freeCount: number;
  packSize: number;
  regensLeft: number;
  stickers: Array<{ index: number; url: string }>;
  selfieUrl: string | null;
}

export interface PackSummary {
  id: string;
  createdAt: string;
  status: string;
  unlocked: boolean;
  /** The user has accepted a pack (got/downloaded/unlocked) — generation is locked. */
  locked: boolean;
  freeCount: number;
  packSize: number;
  regensLeft: number;
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
    private readonly telegramStickerService: TelegramStickerService,
    private readonly stickerQueue: StickerQueueService,
    @Inject(storageConfig.KEY)
    private readonly storage: ConfigType<typeof storageConfig>,
  ) {}

  /**
   * Whether the user has "accepted" a pack and is therefore locked out of
   * generating or regenerating. Acceptance = getting the pack on Telegram,
   * downloading it, or unlocking the full pack. `fullPackUnlockedAt` is folded
   * in so an unlock (via referral) locks generation even though it sets a
   * different column.
   */
  private isLocked(user: {
    generationLockedAt: Date | null;
    fullPackUnlockedAt: Date | null;
  }): boolean {
    return user.generationLockedAt != null || user.fullPackUnlockedAt != null;
  }

  /**
   * Mark the user as having accepted a pack. Set-once (never overwrites an
   * earlier timestamp), idempotent, and safe to call from every accept path.
   */
  private async lockGeneration(userId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId, generationLockedAt: null },
      data: { generationLockedAt: new Date() },
    });
  }

  async generatePack(
    userId: string,
    sourceImage: Buffer,
  ): Promise<{ packId: string }> {
    const maxGenerations = 1 + this.offer.freeRegenerations;

    const pack = await this.prisma.$transaction(async (tx) => {
      // Lock the user row so concurrent POST /packs requests serialize and
      // cannot both pass the quota check at the same time.
      const rows = await tx.$queryRaw<
        Array<{
          generations_used: number;
          generation_locked_at: Date | null;
          full_pack_unlocked_at: Date | null;
        }>
      >`
        SELECT generations_used, generation_locked_at, full_pack_unlocked_at
        FROM users WHERE id = ${userId}::uuid FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new Error(`user ${userId} not found`);
      }

      // Accepting a pack (get/download/unlock) locks generation — even if the
      // raw regeneration quota is not yet exhausted.
      if (
        this.isLocked({
          generationLockedAt: rows[0].generation_locked_at,
          fullPackUnlockedAt: rows[0].full_pack_unlocked_at,
        })
      ) {
        throw new ForbiddenException('generation_locked');
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
          status: 'generating',
        },
        select: { id: true },
      });
    });

    // Write the uploaded image to a staging directory outside the web-served
    // tree. The worker reads it from here and deletes it in its finally block.
    const stagingDir = join(tmpdir(), 'stikup-src');
    const sourceImagePath = join(stagingDir, pack.id);
    try {
      await mkdir(stagingDir, { recursive: true });
      await writeFile(sourceImagePath, sourceImage);
      await this.stickerQueue.enqueueWebPack({
        packId: pack.id,
        userId,
        sourceImagePath,
      });
    } catch (err) {
      // Enqueue failed — roll back the quota increment and mark the pack failed
      // so the UI can surface an error rather than polling forever.
      await this.markPackFailed(pack.id, userId);
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `failed to enqueue web-pack for pack ${pack.id}: ${message}`,
      );
      throw err;
    }

    this.logger.log(
      `enqueued web-pack job for pack ${pack.id}, user ${userId}`,
    );
    return { packId: pack.id };
  }

  /** Set pack status to failed and refund one generationsUsed credit. */
  private async markPackFailed(packId: string, userId: string): Promise<void> {
    await this.prisma.pack.update({
      where: { id: packId },
      data: { status: 'failed' },
    });
    await this.prisma.user.updateMany({
      where: { id: userId, generationsUsed: { gt: 0 } },
      data: { generationsUsed: { decrement: 1 } },
    });
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
      select: {
        fullPackUnlockedAt: true,
        generationsUsed: true,
        generationLockedAt: true,
      },
    });
    const unlocked = user?.fullPackUnlockedAt != null;
    const locked = user ? this.isLocked(user) : false;
    const maxGenerations = 1 + this.offer.freeRegenerations;
    // A locked user has no regenerations left regardless of raw quota.
    const regensLeft = locked
      ? 0
      : Math.max(0, maxGenerations - (user?.generationsUsed ?? 0));

    return packs.map((pack) => ({
      id: pack.id,
      createdAt: pack.createdAt.toISOString(),
      status: pack.status,
      unlocked,
      locked,
      freeCount: this.offer.freeStickerCount,
      packSize: this.offer.packSize,
      regensLeft,
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
        sourceImageUrl: true,
        stickers: {
          select: { index: true, url: true },
          orderBy: { index: 'asc' },
        },
      },
    });

    if (!pack || pack.userId !== userId) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        fullPackUnlockedAt: true,
        generationsUsed: true,
        generationLockedAt: true,
      },
    });

    const maxGenerations = 1 + this.offer.freeRegenerations;
    const locked = user ? this.isLocked(user) : false;

    return {
      id: pack.id,
      status: pack.status,
      unlocked: user?.fullPackUnlockedAt != null,
      locked,
      freeCount: this.offer.freeStickerCount,
      packSize: this.offer.packSize,
      // A locked user has no regenerations left regardless of raw quota.
      regensLeft: locked
        ? 0
        : Math.max(0, maxGenerations - (user?.generationsUsed ?? 0)),
      stickers: pack.stickers,
      selfieUrl: pack.sourceImageUrl ?? null,
    };
  }

  async deletePack(packId: string, userId: string): Promise<boolean> {
    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
      select: { userId: true },
    });
    if (!pack || pack.userId !== userId) return false;

    await this.prisma.pack.delete({ where: { id: packId } });

    // Best-effort: remove the on-disk pack directory (stickers + the persisted
    // source-selfie thumbnail) so deleted packs don't leak the user's image.
    await rm(join(this.storage.stickerDir, packId), {
      recursive: true,
      force: true,
    }).catch((err: unknown) => {
      this.logger.debug(
        `failed to remove pack dir for ${packId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    });

    this.logger.log(`deleted pack ${packId} for user ${userId}`);
    return true;
  }

  /**
   * Record that the user downloaded their pack. Downloading counts as
   * accepting the pack, so this locks generation/regeneration. No-op (and
   * does not lock) if the pack is missing or not owned by the user.
   */
  async markDownloaded(
    packId: string,
    userId: string,
  ): Promise<MarkDownloadedResult> {
    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
      select: { userId: true },
    });
    if (!pack || pack.userId !== userId) {
      this.logger.log(
        `mark-downloaded: pack ${packId} not found or not owned by user ${userId}`,
      );
      return { locked: false };
    }

    await this.lockGeneration(userId);
    this.logger.log(
      `mark-downloaded: locked generation for user ${userId} (pack ${packId})`,
    );
    return { locked: true };
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
      select: { channelUserId: true, username: true },
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

    // Try to insert the delivery claim. On P2002 (already claimed) this is a
    // re-delivery — do NOT dead-end; continue to re-send the existing link.
    let thisCallOwnsClaim = false;
    try {
      await this.prisma.packClaim.create({
        data: { packId, userId, channel: this.botSender.channel },
      });
      thisCallOwnsClaim = true;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        this.logger.log(
          `deliver-telegram: pack ${packId} already claimed by user ${userId}, re-delivering`,
        );
        // wasAlreadyClaimed — continue with re-delivery
      } else {
        throw err;
      }
    }

    const files = getPlaceholderFiles(count);
    if (files.length === 0) {
      this.logger.warn(
        `deliver-telegram: no placeholder files found; aborting delivery`,
      );
      if (thisCallOwnsClaim) {
        await this.prisma.packClaim.delete({
          where: { packId_userId: { packId, userId } },
        });
      }
      return { delivered: false, botUrl };
    }

    const usernameOrFallback =
      identity.username ?? `user${identity.channelUserId}`;

    let ensureResult: { name: string; shareUrl: string; count: number };
    try {
      ensureResult = await this.telegramStickerService.ensureSet({
        channelUserId: identity.channelUserId,
        packId,
        usernameOrFallback,
        files,
      });
    } catch (err) {
      this.logger.warn(
        `deliver-telegram: ensureSet failed for pack ${packId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      if (thisCallOwnsClaim) {
        await this.prisma.packClaim.delete({
          where: { packId_userId: { packId, userId } },
        });
      }
      return { delivered: false, botUrl };
    }

    // Persist sticker set info on the pack.
    await this.prisma.pack.update({
      where: { id: packId },
      data: {
        telegramStickerSetName: ensureResult.name,
        telegramStickerCount: ensureResult.count,
      },
    });

    // Best-effort: a transient send failure must not surface as a 500 after
    // the set is already created and the claim persisted.
    try {
      await this.botSender.sendMessage(
        identity.channelUserId,
        `Your sticker pack is ready! Add it to Telegram: ${ensureResult.shareUrl}`,
      );
    } catch (err) {
      this.logger.warn(
        `deliver-telegram: sendMessage failed for pack ${packId} user ${identity.channelUserId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Getting the pack on Telegram counts as accepting it — lock generation.
    await this.lockGeneration(userId);

    this.logger.log(
      `deliver-telegram: delivered sticker set to ${this.botSender.channel} user ${identity.channelUserId}, url=${ensureResult.shareUrl}`,
    );

    return { delivered: true, botUrl, stickerSetUrl: ensureResult.shareUrl };
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
        // A claim already exists → the pack was accepted; make sure the lock is
        // set even if the original accept's lock write was lost.
        await this.lockGeneration(userId);
        return { delivered: false, botUrl, alreadyClaimed: true };
      }
      throw err;
    }

    const stickers = this.getFreeStickerFiles();
    for (const filename of stickers) {
      const path = join(FREE_STICKER_DIR, filename);
      await this.botSender.sendSticker(identity.channelUserId, path);
    }

    // Claiming the free stickers counts as accepting the pack — lock generation.
    await this.lockGeneration(userId);

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
