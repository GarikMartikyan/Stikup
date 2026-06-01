import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsIn, IsString, validateSync } from 'class-validator';

import { getEnvProfile, isPlaceholder } from './environment';

export type OpenAIImageQuality = 'low' | 'medium' | 'high' | 'auto';
export type OpenAIInputFidelity = 'high' | 'low';

export class OpenAIConfigSchema {
  @IsString()
  apiKey!: string;

  @IsString()
  model!: string;

  @IsString()
  size!: string;

  // Higher quality = cleaner gutters between the 12 cells → more reliable split.
  @IsIn(['low', 'medium', 'high', 'auto'])
  quality!: OpenAIImageQuality;

  // 'high' makes the chibi preserve the reference person's hairstyle/features.
  @IsIn(['high', 'low'])
  inputFidelity!: OpenAIInputFidelity;
}

export const openaiConfig = registerAs('openai', (): OpenAIConfigSchema => {
  const raw = {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2',
    size: process.env.OPENAI_IMAGE_SIZE ?? '1536x1024',
    quality: (process.env.OPENAI_IMAGE_QUALITY ??
      'medium') as OpenAIImageQuality,
    inputFidelity: (process.env.OPENAI_IMAGE_INPUT_FIDELITY ??
      'high') as OpenAIInputFidelity,
  };

  const instance = plainToInstance(OpenAIConfigSchema, raw);
  const errors = validateSync(instance, { whitelist: true });
  if (errors.length) {
    throw new Error(
      'Invalid OPENAI config:\n' + errors.map((e) => e.toString()).join('\n'),
    );
  }

  // Only enforce a real key when AI_PROVIDER=openai in production;
  // stub-mode deployments must still boot without an API key.
  if (
    process.env.AI_PROVIDER === 'openai' &&
    getEnvProfile().strictSecrets &&
    isPlaceholder(instance.apiKey)
  ) {
    throw new Error(
      'OPENAI_API_KEY must be set to a real value when AI_PROVIDER=openai in production.',
    );
  }

  return instance;
});
