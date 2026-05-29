import { Controller, Get, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { offerConfig } from './offer.config';

export class OfferDto {
  priceLabel!: string;
  priceAmountCents!: number;
  currency!: string;
  packSize!: number;
  freeStickerCount!: number;
  paidGenerations!: number;
  freeGenerations!: number;
  freeRegenerations!: number;
  referralUnlockEnabled!: boolean;
}

@ApiTags('config')
@Controller('config')
export class ConfigController {
  constructor(
    @Inject(offerConfig.KEY)
    private readonly offer: ConfigType<typeof offerConfig>,
  ) {}

  @Get('offer')
  @ApiOkResponse({ type: OfferDto })
  getOffer(): OfferDto {
    return {
      priceLabel: this.offer.priceLabel,
      priceAmountCents: this.offer.priceAmountCents,
      currency: this.offer.currency,
      packSize: this.offer.packSize,
      freeStickerCount: this.offer.freeStickerCount,
      paidGenerations: this.offer.paidGenerations,
      freeGenerations: this.offer.freeGenerations,
      freeRegenerations: this.offer.freeRegenerations,
      referralUnlockEnabled: this.offer.referralUnlockEnabled,
    };
  }
}
