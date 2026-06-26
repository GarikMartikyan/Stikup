import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsPositive,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

export class OfferConfigSchema {
  @IsInt()
  @IsPositive()
  packSize!: number;

  @IsInt()
  @IsPositive()
  freeStickerCount!: number;

  /** Generations granted to every new user. */
  @IsInt()
  @IsPositive()
  baseGenerations!: number;

  /** Additional generations earned per referred user who signs up. 0 disables the bonus. */
  @IsInt()
  @Min(0)
  referralBonusGenerations!: number;

  @IsBoolean()
  referralUnlockEnabled!: boolean;

  @IsString()
  stickerDefaultEmoji!: string;

  // Local/testing escape hatch: when true, bypass the per-user generation
  // quota so a pack can be (re)generated without limit.
  // Defaults to false — production and normal dev keep the real limits.
  @IsBoolean()
  unlimitedGenerations!: boolean;
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
    baseGenerations: toInt(process.env.OFFER_BASE_GENERATIONS, 2),
    referralBonusGenerations: toInt(
      process.env.OFFER_REFERRAL_BONUS_GENERATIONS,
      2,
    ),
    referralUnlockEnabled: toBool(process.env.OFFER_REFERRAL_UNLOCK, true),
    stickerDefaultEmoji: process.env.STICKER_DEFAULT_EMOJI?.trim() || '😀',
    unlimitedGenerations: toBool(
      process.env.OFFER_UNLIMITED_GENERATIONS,
      false,
    ),
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
