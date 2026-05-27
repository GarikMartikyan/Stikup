import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

import type { BotSender } from '../auth/channel/bot-sender';
import { BOT_SENDER } from '../auth/channel/bot-sender';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { STICKER_QUEUE_NAME, StickerJobData } from './sticker.queue';

@Processor(STICKER_QUEUE_NAME)
export class StickerProcessor extends WorkerHost {
  private readonly logger = new Logger(StickerProcessor.name);

  constructor(
    private readonly imageProcessing: ImageProcessingService,
    @Inject(BOT_SENDER) private readonly botSender: BotSender,
  ) {
    super();
  }

  async process(job: Job<StickerJobData>): Promise<void> {
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
}
