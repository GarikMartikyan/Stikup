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
  @IsString()
  priceLabel!: string;

  @IsInt()
  @IsPositive()
  priceAmountCents!: number;

  @IsString()
  currency!: string;

  @IsInt()
  @IsPositive()
  packSize!: number;

  @IsInt()
  @IsPositive()
  freeStickerCount!: number;

  @IsInt()
  @IsPositive()
  paidGenerations!: number;

  @IsInt()
  @IsPositive()
  freeGenerations!: number;

  @IsInt()
  @IsPositive()
  freeRegenerations!: number;

  @IsBoolean()
  referralUnlockEnabled!: boolean;

  @IsString()
  stickerDefaultEmoji!: string;

  // Local/testing escape hatch: when true, bypass the per-user generation
  // quota AND the accept-lock so a pack can be (re)generated without limit.
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
    priceLabel: process.env.OFFER_PRICE_LABEL || '$5',
    priceAmountCents: toInt(process.env.OFFER_PRICE_CENTS, 500),
    currency: process.env.OFFER_CURRENCY || 'USD',
    packSize: toInt(process.env.OFFER_PACK_SIZE, 12),
    freeStickerCount: toInt(process.env.OFFER_FREE_STICKER_COUNT, 3),
    paidGenerations: toInt(process.env.OFFER_PAID_GENERATIONS, 10),
    freeGenerations: toInt(process.env.OFFER_FREE_GENERATIONS, 1),
    freeRegenerations: toInt(process.env.OFFER_FREE_REGENERATIONS, 1),
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
