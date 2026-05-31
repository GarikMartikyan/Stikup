import { Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';

import { openaiConfig } from '../config/openai.config';
import type { AiImageProvider } from './ai-image-provider';

export class OpenAIImageProvider implements AiImageProvider {
  private readonly logger = new Logger(OpenAIImageProvider.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly size: string;

  constructor(config: ConfigType<typeof openaiConfig>) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
    this.size = config.size;
  }

  async generate(sourceImage: Buffer, prompt: string): Promise<Buffer> {
    if (sourceImage.length === 0) {
      throw new Error('openai provider: empty source image');
    }

    // Auto-orient EXIF rotation, cap dimensions, and guarantee a valid PNG
    // regardless of input format (HEIC, JPEG, WebP, etc.).
    const pngBuffer = await sharp(sourceImage)
      .rotate()
      .resize({
        width: 2048,
        height: 2048,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    this.logger.log(
      `openai images.edit: model=${this.model} size=${this.size} sourceBytes=${pngBuffer.length}`,
    );

    let b64: string;
    try {
      // gpt-image models always return base64 (b64_json); response_format is
      // only meaningful for dall-e-2, so it is intentionally omitted here.
      const result = await this.client.images.edit({
        model: this.model,
        image: await toFile(pngBuffer, 'source.png', { type: 'image/png' }),
        prompt,
        size: this.size,
      });

      const raw = result.data?.[0]?.b64_json;
      if (!raw) {
        throw new Error('openai provider: response missing b64_json');
      }
      b64 = raw;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('openai provider:')) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`openai provider: API call failed — ${message}`);
    }

    return Buffer.from(b64, 'base64');
  }
}
