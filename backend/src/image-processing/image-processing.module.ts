import { Module, Provider } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { aiConfig } from '../config/ai.config';
import { openaiConfig } from '../config/openai.config';
import { AI_IMAGE_PROVIDER, AiImageProvider } from './ai-image-provider';
import { ImageProcessingService } from './image-processing.service';
import { OpenAIImageProvider } from './openai-image-provider';
import { StubAiImageProvider } from './stub-ai-image-provider';

const aiImageProvider: Provider = {
  provide: AI_IMAGE_PROVIDER,
  inject: [aiConfig.KEY, openaiConfig.KEY],
  useFactory: (
    ai: ConfigType<typeof aiConfig>,
    openai: ConfigType<typeof openaiConfig>,
  ): AiImageProvider => {
    switch (ai.provider) {
      case 'stub':
        return new StubAiImageProvider();
      case 'openai':
        return new OpenAIImageProvider(openai);
      default: {
        // Exhaustiveness guard — TypeScript will catch this at compile time if
        // AiProviderName gains a new member without a corresponding case.
        const _never: never = ai.provider;
        throw new Error(`unknown AI_PROVIDER: ${String(_never)}`);
      }
    }
  },
};

@Module({
  providers: [ImageProcessingService, StubAiImageProvider, aiImageProvider],
  exports: [ImageProcessingService],
})
export class ImageProcessingModule {}
