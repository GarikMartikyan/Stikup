import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';

import { getEnvProfile, isPlaceholder } from './environment';

export class TelegramConfigSchema {
  @IsString()
  botToken!: string;
}

export const telegramConfig = registerAs(
  'telegram',
  (): TelegramConfigSchema => {
    const raw = {
      botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    };

    const instance = plainToInstance(TelegramConfigSchema, raw);
    const errors = validateSync(instance, { whitelist: true });
    if (errors.length) {
      throw new Error(
        'Invalid TELEGRAM config:\n' +
          errors.map((e) => e.toString()).join('\n'),
      );
    }

    if (getEnvProfile().strictSecrets && isPlaceholder(instance.botToken)) {
      throw new Error(
        'TELEGRAM_BOT_TOKEN must be set to a real value in production.',
      );
    }

    return instance;
  },
);
