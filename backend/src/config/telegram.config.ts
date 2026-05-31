import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  validateSync,
} from 'class-validator';

import { getEnvProfile, isPlaceholder } from './environment';

export class TelegramConfigSchema {
  @IsString()
  botToken!: string;

  @IsInt()
  @IsPositive()
  initDataMaxAgeSec!: number;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  miniAppUrl?: string;
}

function toInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const telegramConfig = registerAs(
  'telegram',
  (): TelegramConfigSchema => {
    const raw = {
      botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
      initDataMaxAgeSec: toInt(
        process.env.TELEGRAM_INITDATA_MAX_AGE_SEC,
        86400,
      ),
      // Use || undefined so an empty string is treated as unset and skips
      // the @IsUrl validator rather than failing it.
      miniAppUrl: process.env.TELEGRAM_MINI_APP_URL || undefined,
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
