import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Injectable, Logger } from '@nestjs/common';
import { AiImageProvider } from './ai-image-provider';

const STUB_IMAGE_PATH = join(__dirname, '..', '..', 'public', 'testimage.png');

@Injectable()
export class StubAiImageProvider implements AiImageProvider {
  private readonly logger = new Logger(StubAiImageProvider.name);

  async generate(sourceImage: Buffer, prompt: string): Promise<Buffer> {
    this.logger.log(
      `stub ai call: prompt="${prompt}" sourceBytes=${sourceImage.length}`,
    );
    return readFile(STUB_IMAGE_PATH);
  }
}
