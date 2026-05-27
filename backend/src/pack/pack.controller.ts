import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request } from 'express';

import { SessionService } from '../auth/session.service';
import { sessionConfig } from '../config/session.config';
import { ClaimFreeResult, PackService } from './pack.service';

@Controller('packs')
export class PackController {
  constructor(
    private readonly sessions: SessionService,
    private readonly packs: PackService,
    @Inject(sessionConfig.KEY)
    private readonly session: ConfigType<typeof sessionConfig>,
  ) {}

  @Get('bot-url')
  async botUrl(): Promise<{ botUrl: string }> {
    const botUrl = await this.packs.getBotUrl();
    return { botUrl };
  }

  @Post(':packId/claim-free')
  async claimFree(
    @Param('packId') packId: string,
    @Req() req: Request,
  ): Promise<ClaimFreeResult> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();

    return this.packs.claimFreeStickers(packId, session.userId);
  }
}
