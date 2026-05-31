import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';

import { getEnvProfile, isPlaceholder } from './environment';

export class OpenAIConfigSchema {
  @IsString()
  apiKey!: string;

  @IsString()
  model!: string;

  @IsString()
  size!: string;
}

export const openaiConfig = registerAs('openai', (): OpenAIConfigSchema => {
  const raw = {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1',
    size: process.env.OPENAI_IMAGE_SIZE ?? '1024x1024',
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
