import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsIn, validateSync } from 'class-validator';

export type AiProviderName = 'stub';

export class AiConfigSchema {
  @IsIn(['stub'])
  provider!: AiProviderName;
}

export const aiConfig = registerAs('ai', (): AiConfigSchema => {
  const raw = {
    provider: (process.env.AI_PROVIDER ?? 'stub') as AiProviderName,
  };

  const instance = plainToInstance(AiConfigSchema, raw);
  const errors = validateSync(instance, { whitelist: true });
  if (errors.length) {
    throw new Error(
      'Invalid AI config:\n' + errors.map((e) => e.toString()).join('\n'),
    );
  }
  return instance;
});
