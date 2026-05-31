import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

export const STICKER_QUEUE_NAME = 'stickers';

export interface StickerJobData {
  channelUserId: string;
  chatId: number;
  prompt: string;
}

export interface WebPackJobData {
  packId: string;
  userId: string;
  sourceImagePath: string;
}

@Injectable()
export class StickerQueueService {
  constructor(
    @InjectQueue(STICKER_QUEUE_NAME)
    private readonly queue: Queue<StickerJobData | WebPackJobData>,
  ) {}

  async enqueue(data: StickerJobData): Promise<void> {
    await this.queue.add('generate', data, {
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async enqueueWebPack(data: WebPackJobData): Promise<void> {
    await this.queue.add('web-pack', data, {
      attempts: 1,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }
}
