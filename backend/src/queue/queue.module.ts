import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { redisConfig } from '../config/redis.config';
import { ImageProcessingModule } from '../image-processing/image-processing.module';
import { StickerProcessor } from './sticker.processor';
import { STICKER_QUEUE_NAME, StickerQueueService } from './sticker.queue';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (redis: ConfigType<typeof redisConfig>) => ({
        connection: { url: redis.url },
      }),
    }),
    BullModule.registerQueue({ name: STICKER_QUEUE_NAME }),
    ImageProcessingModule,
    AuthModule,
  ],
  providers: [StickerQueueService, StickerProcessor],
  exports: [StickerQueueService],
})
export class QueueModule {}
