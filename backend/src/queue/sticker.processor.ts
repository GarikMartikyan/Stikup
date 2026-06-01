import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Job } from 'bullmq';
import sharp from 'sharp';

import type { BotSender } from '../auth/channel/bot-sender';
import { BOT_SENDER } from '../auth/channel/bot-sender';
import { storageConfig } from '../config/storage.config';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { STICKER_PROMPT } from '../image-processing/sticker-prompt';
import { PrismaService } from '../prisma/prisma.service';
import {
  STICKER_QUEUE_NAME,
  StickerJobData,
  WebPackJobData,
} from './sticker.queue';

@Processor(STICKER_QUEUE_NAME)
export class StickerProcessor extends WorkerHost {
  private readonly logger = new Logger(StickerProcessor.name);

  constructor(
    private readonly imageProcessing: ImageProcessingService,
    @Inject(BOT_SENDER) private readonly botSender: BotSender,
    private readonly prisma: PrismaService,
    @Inject(storageConfig.KEY)
    private readonly storage: ConfigType<typeof storageConfig>,
  ) {
    super();
  }

  async process(job: Job<StickerJobData | WebPackJobData>): Promise<void> {
    if (job.name === 'web-pack') {
      return this.processWebPack(job as Job<WebPackJobData>);
    }
    return this.processGenerate(job as Job<StickerJobData>);
  }

  private async processGenerate(job: Job<StickerJobData>): Promise<void> {
    const { channelUserId, prompt } = job.data;
    try {
      const { stickerPaths, cleanup } =
        await this.imageProcessing.generateStickers(Buffer.alloc(0), prompt);

      try {
        if (stickerPaths.length === 0) {
          this.logger.warn(
            `job ${job.id}: no stickers produced for user ${channelUserId}`,
          );
          return;
        }

        for (const stickerPath of stickerPaths) {
          await this.botSender.sendSticker(channelUserId, stickerPath);
        }
      } finally {
        await cleanup();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `job ${job.id} failed for user ${channelUserId}: ${message}`,
      );
    }
  }

  private async processWebPack(job: Job<WebPackJobData>): Promise<void> {
    const { packId, userId, sourceImagePath } = job.data;
    let cleanup: (() => Promise<void>) | null = null;

    try {
      const sourceBuffer = await readFile(sourceImagePath);

      const result = await this.imageProcessing.generateStickers(
        sourceBuffer,
        STICKER_PROMPT,
      );
      cleanup = result.cleanup;
      const { stickerPaths } = result;

      if (stickerPaths.length < 12) {
        throw new Error(`expected 12 stickers, got ${stickerPaths.length}`);
      }

      const packDir = join(this.storage.stickerDir, packId);
      await mkdir(packDir, { recursive: true });

      // Persist a browser-renderable thumbnail of the source selfie. Best-effort:
      // some accepted upload formats (notably HEIC) can't be decoded by the
      // bundled sharp binary, and the stub AI provider never decodes the source
      // at all — so a thumbnail failure must NOT fail an otherwise-successful
      // pack. On failure we leave sourceImageUrl null and the UI falls back to a
      // stock avatar.
      let sourceImageUrl: string | null = null;
      try {
        const sourceWebp = await sharp(sourceBuffer)
          .rotate() // respect EXIF orientation
          .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        await writeFile(join(packDir, 'source.webp'), sourceWebp);
        sourceImageUrl = `/api/static/packs/${packId}/source.webp`;
      } catch (err) {
        this.logger.warn(
          `web-pack job ${job.id}: failed to persist source thumbnail for pack ${packId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }

      // Copy in sorted order (the service already sorts); name as sticker_1..12
      const sorted = [...stickerPaths].sort();
      for (let i = 0; i < 12; i++) {
        const destName = `sticker_${i + 1}.webp`;
        await copyFile(sorted[i], join(packDir, destName));
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.sticker.createMany({
          data: Array.from({ length: 12 }, (_, i) => ({
            packId,
            index: i,
            url: `/api/static/packs/${packId}/sticker_${i + 1}.webp`,
          })),
        });
        await tx.pack.update({
          where: { id: packId },
          data: {
            status: 'ready',
            sourceImageUrl,
          },
        });
      });

      this.logger.log(`web-pack job ${job.id}: pack ${packId} is ready`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `web-pack job ${job.id} failed for pack ${packId}: ${message}`,
      );

      await this.prisma.pack.update({
        where: { id: packId },
        data: { status: 'failed' },
      });

      // Refund the generation — floor at 0 via the conditional decrement.
      await this.prisma.user.updateMany({
        where: { id: userId, generationsUsed: { gt: 0 } },
        data: { generationsUsed: { decrement: 1 } },
      });

      // Remove any sticker files copied before the failure — no Sticker rows
      // reference them, so they would otherwise leak on disk indefinitely.
      await rm(join(this.storage.stickerDir, packId), {
        recursive: true,
        force: true,
      }).catch((rmErr: unknown) => {
        this.logger.debug(
          `failed to remove pack dir for ${packId}: ${
            rmErr instanceof Error ? rmErr.message : String(rmErr)
          }`,
        );
      });
    } finally {
      if (cleanup) {
        await cleanup();
      }
      try {
        await rm(sourceImagePath, { force: true });
      } catch (rmErr) {
        this.logger.debug(
          `failed to remove staging file ${sourceImagePath}: ${
            rmErr instanceof Error ? rmErr.message : String(rmErr)
          }`,
        );
      }
    }
  }
}
