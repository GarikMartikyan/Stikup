import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { AI_IMAGE_PROVIDER } from './ai-image-provider';
import type { AiImageProvider } from './ai-image-provider';

const execFileAsync = promisify(execFile);

const PYTHON_BIN = 'python3';
const PYTHON_SCRIPT = join(__dirname, '..', '..', 'python', 'process_image.py');

export type StickerStage = 'ai' | 'post';
export type StickerProgress = (stage: StickerStage) => Promise<void> | void;

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  constructor(
    @Inject(AI_IMAGE_PROVIDER)
    private readonly aiProvider: AiImageProvider,
  ) {}

  async generateSticker(
    sourceImage: Buffer,
    prompt: string,
    onProgress?: StickerProgress,
  ): Promise<string> {
    await onProgress?.('ai');
    const aiOutput = await this.aiProvider.generate(sourceImage, prompt);

    const jobId = randomUUID();
    const aiInputPath = join(tmpdir(), `sticker_${jobId}_ai.png`);
    const finalOutputPath = join(tmpdir(), `sticker_${jobId}.webp`);

    await writeFile(aiInputPath, aiOutput);

    await onProgress?.('post');
    try {
      const { stderr } = await execFileAsync(PYTHON_BIN, [
        PYTHON_SCRIPT,
        aiInputPath,
        finalOutputPath,
      ]);
      if (stderr) {
        this.logger.warn(`python stderr: ${stderr}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`python image processing failed: ${message}`);
    }

    this.logger.log(`sticker ready at ${finalOutputPath}`);
    return finalOutputPath;
  }
}
