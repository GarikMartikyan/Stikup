import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
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

  // Whether to launch the bot's long-polling (getUpdates) loop. Telegram
  // allows only ONE poller per token, so the live production bot owning
  // the token would otherwise crash a local instance with a 409 Conflict.
  // The injected Telegraf client still works for outgoing calls (sending
  // stickers/messages) regardless — only inbound polling is gated here.
  @IsBoolean()
  launchBot!: boolean;

  // Telegram numeric user id that receives monitoring alerts and may run
  // /userscount. Leave blank to disable admin features.
  @IsOptional()
  @IsInt()
  @IsPositive()
  adminChatId?: number;
}

function toBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

function toInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIntOptional(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const telegramConfig = registerAs(
  'telegram',
  (): TelegramConfigSchema => {
    const raw = {
      botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
      // Mini App authenticates immediately on open, so keep the HMAC freshness
      // window short (1h) to limit replay of a leaked initData string. Override
      // via TELEGRAM_INITDATA_MAX_AGE_SEC if a longer window is needed.
      initDataMaxAgeSec: toInt(process.env.TELEGRAM_INITDATA_MAX_AGE_SEC, 3600),
      // Use || undefined so an empty string is treated as unset and skips
      // the @IsUrl validator rather than failing it.
      miniAppUrl: process.env.TELEGRAM_MINI_APP_URL || undefined,
      // Default: poll in production (single owner of the token), skip in
      // dev/test so a local instance never fights the live bot for getUpdates.
      launchBot: toBool(
        process.env.TELEGRAM_BOT_LAUNCH,
        getEnvProfile().isProd,
      ),
      adminChatId: toIntOptional(process.env.ADMIN_TELEGRAM_ID),
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
