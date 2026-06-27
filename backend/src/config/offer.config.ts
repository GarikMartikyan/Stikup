import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsPositive,
  IsString,
  validateSync,
} from 'class-validator';

export class OfferConfigSchema {
  @IsInt()
  @IsPositive()
  packSize!: number;

  @IsInt()
  @IsPositive()
  freeStickerCount!: number;

  @IsBoolean()
  referralUnlockEnabled!: boolean;

  @IsString()
  stickerDefaultEmoji!: string;
}

function toInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && Number.isInteger(parsed)
    ? parsed
    : fallback;
}

function toBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw.toLowerCase() === 'true';
}

export const offerConfig = registerAs('offer', (): OfferConfigSchema => {
  const raw = {
    packSize: toInt(process.env.OFFER_PACK_SIZE, 12),
    freeStickerCount: toInt(process.env.OFFER_FREE_STICKER_COUNT, 3),
    referralUnlockEnabled: toBool(process.env.OFFER_REFERRAL_UNLOCK, true),
    stickerDefaultEmoji: process.env.STICKER_DEFAULT_EMOJI?.trim() || '😀',
  };

  const instance = plainToInstance(OfferConfigSchema, raw);
  const errors = validateSync(instance, { whitelist: true });
  if (errors.length) {
    throw new Error(
      'Invalid OFFER config:\n' + errors.map((e) => e.toString()).join('\n'),
    );
  }
  return instance;
});
