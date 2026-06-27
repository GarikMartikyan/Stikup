import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Job } from 'bullmq';

import { storageConfig } from '../config/storage.config';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { PrismaService } from '../prisma/prisma.service';
import { STICKER_QUEUE_NAME, WebPackJobData } from './sticker.queue';

@Processor(STICKER_QUEUE_NAME)
export class StickerProcessor extends WorkerHost {
  private readonly logger = new Logger(StickerProcessor.name);

  constructor(
    private readonly imageProcessing: ImageProcessingService,
    private readonly prisma: PrismaService,
    @Inject(storageConfig.KEY)
    private readonly storage: ConfigType<typeof storageConfig>,
  ) {
    super();
  }

  async process(job: Job<WebPackJobData>): Promise<void> {
    return this.processWebPack(job);
  }

  private async processWebPack(job: Job<WebPackJobData>): Promise<void> {
    const { packId, sourceImagePath } = job.data;
    let cleanup: (() => Promise<void>) | null = null;

    try {
      const sourceBuffer = await readFile(sourceImagePath);

      // Split the uploaded 4×3 grid directly — no AI call.
      const result = await this.imageProcessing.generateStickers(sourceBuffer);
      cleanup = result.cleanup;
      const { stickerPaths } = result;

      if (stickerPaths.length < 12) {
        // The Python splitter skips cells it judges empty, so a messy grid can
        // yield fewer than 12 stickers. Mark the pack failed and refund the
        // generation so the user can re-upload a clean 3×4 grid. Do NOT throw
        // (that would log as a generic system error); this is an expected user
        // error and is surfaced to the frontend via pack.status = 'failed'.
        this.logger.warn(
          `web-pack job ${job.id}: grid split yielded ${stickerPaths.length} sticker(s) for pack ${packId}; expected 12 — marking failed`,
        );
        await this.prisma.pack.update({
          where: { id: packId },
          data: { status: 'failed' },
        });
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
        return;
      }

      const packDir = join(this.storage.stickerDir, packId);
      await mkdir(packDir, { recursive: true });

      // Note: the source-selfie thumbnail (source.webp) is written up front at
      // upload time (PackService.generatePack) so the result page can show it
      // during generation — the worker does not need to produce it.

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
          data: { status: 'ready' },
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
