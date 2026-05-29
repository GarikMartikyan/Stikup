import {
  Controller,
  Get,
  Inject,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { SessionService } from '../auth/session.service';
import { sessionConfig } from '../config/session.config';
import { ReferralService } from './referral.service';

@ApiTags('referral')
@Controller('referral')
export class ReferralController {
  constructor(
    private readonly sessions: SessionService,
    private readonly referrals: ReferralService,
    @Inject(sessionConfig.KEY)
    private readonly session: ConfigType<typeof sessionConfig>,
  ) {}

  @Get('me')
  @ApiOkResponse({
    schema: {
      properties: {
        code: { type: 'string' },
        link: { type: 'string', format: 'uri' },
        unlocked: { type: 'boolean' },
        referredCount: { type: 'integer' },
      },
      required: ['code', 'link', 'unlocked', 'referredCount'],
    },
  })
  @ApiUnauthorizedResponse()
  async me(@Req() req: Request): Promise<{
    code: string;
    link: string;
    unlocked: boolean;
    referredCount: number;
  }> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();

    return this.referrals.getOrCreateReferralInfo(session.userId);
  }
}
