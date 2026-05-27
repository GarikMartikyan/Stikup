import { Module, Provider } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { aiConfig } from '../config/ai.config';
import { AI_IMAGE_PROVIDER, AiImageProvider } from './ai-image-provider';
import { ImageProcessingService } from './image-processing.service';
import { StubAiImageProvider } from './stub-ai-image-provider';

const aiImageProvider: Provider = {
  provide: AI_IMAGE_PROVIDER,
  inject: [aiConfig.KEY],
  useFactory: (ai: ConfigType<typeof aiConfig>): AiImageProvider => {
    switch (ai.provider) {
      case 'stub':
        return new StubAiImageProvider();
    }
  },
};

@Module({
  providers: [ImageProcessingService, StubAiImageProvider, aiImageProvider],
  exports: [ImageProcessingService],
})
export class ImageProcessingModule {}
