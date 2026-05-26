import { Module } from '@nestjs/common';

import { AI_IMAGE_PROVIDER } from './ai-image-provider';
import { ImageProcessingService } from './image-processing.service';
import { StubAiImageProvider } from './stub-ai-image-provider';

@Module({
  providers: [
    ImageProcessingService,
    { provide: AI_IMAGE_PROVIDER, useClass: StubAiImageProvider },
  ],
  exports: [ImageProcessingService],
})
export class ImageProcessingModule {}
