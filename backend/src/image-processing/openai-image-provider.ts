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
  private readonly quality: 'low' | 'medium' | 'high' | 'auto';
  private readonly inputFidelity: 'high' | 'low';

  constructor(config: ConfigType<typeof openaiConfig>) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
    this.size = config.size;
    this.quality = config.quality;
    this.inputFidelity = config.inputFidelity;
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

    // input_fidelity is only valid on gpt-image-1. gpt-image-2 processes every
    // input at high fidelity automatically and rejects the parameter with a
    // 400 ("does not support the 'input_fidelity' parameter"), which fails the
    // whole generation — so it must be omitted for any other model.
    const usesInputFidelity = this.model === 'gpt-image-1';

    this.logger.log(
      `openai images.edit: model=${this.model} size=${this.size} ` +
        `quality=${this.quality} ` +
        `inputFidelity=${usesInputFidelity ? this.inputFidelity : 'n/a'} ` +
        `sourceBytes=${pngBuffer.length}`,
    );

    let b64: string;
    try {
      // gpt-image models always return base64 (b64_json); response_format is
      // only meaningful for dall-e-2, so it is intentionally omitted here.
      // background:'opaque' is REQUIRED — the downstream splitter reads the
      // sheet with cv2.IMREAD_COLOR (alpha dropped), so a transparent sheet
      // would chroma-key to nothing and yield zero stickers.
      const result = await this.client.images.edit({
        model: this.model,
        image: await toFile(pngBuffer, 'source.png', { type: 'image/png' }),
        prompt,
        size: this.size,
        background: 'opaque',
        quality: this.quality,
        ...(usesInputFidelity ? { input_fidelity: this.inputFidelity } : {}),
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
