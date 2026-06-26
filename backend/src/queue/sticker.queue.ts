import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

export const STICKER_QUEUE_NAME = 'stickers';

export interface WebPackJobData {
  packId: string;
  userId: string;
  sourceImagePath: string;
}

@Injectable()
export class StickerQueueService {
  constructor(
    @InjectQueue(STICKER_QUEUE_NAME)
    private readonly queue: Queue<WebPackJobData>,
  ) {}

  async enqueueWebPack(data: WebPackJobData): Promise<void> {
    await this.queue.add('web-pack', data, {
      attempts: 1,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }
}
