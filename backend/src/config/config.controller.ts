import { Controller, Get, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';

import { offerConfig } from './offer.config';

export class OfferDto {
  @ApiProperty()
  packSize!: number;

  @ApiProperty()
  freeStickerCount!: number;

  @ApiProperty()
  baseGenerations!: number;

  @ApiProperty()
  referralBonusGenerations!: number;

  @ApiProperty()
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
      packSize: this.offer.packSize,
      freeStickerCount: this.offer.freeStickerCount,
      baseGenerations: this.offer.baseGenerations,
      referralBonusGenerations: this.offer.referralBonusGenerations,
      referralUnlockEnabled: this.offer.referralUnlockEnabled,
    };
  }
}
