import {
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { SessionService } from '../auth/session.service';
import { sessionConfig } from '../config/session.config';
import { AdRewardService } from './ad-reward.service';

@ApiTags('ads')
@Controller('ads')
export class AdRewardController {
  constructor(
    private readonly sessions: SessionService,
    private readonly adRewards: AdRewardService,
    @Inject(sessionConfig.KEY)
    private readonly session: ConfigType<typeof sessionConfig>,
  ) {}

  // Abuse backstop only — NOT a product cap. The reward policy is unlimited
  // (1 ad = +1 generation); a human cannot watch more than a few dozen
  // ~15-30s ads per hour, so 60/hr never bothers a real user.
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  @Post('reward')
  @HttpCode(200)
  @ApiOkResponse({
    schema: {
      properties: { regensLeft: { type: 'integer' } },
      required: ['regensLeft'],
    },
  })
  @ApiUnauthorizedResponse()
  async reward(@Req() req: Request): Promise<{ regensLeft: number }> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();

    return this.adRewards.grantAdReward(session.userId);
  }
}
