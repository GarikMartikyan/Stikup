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
import {
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { BOT_SENDER, type BotSender } from '../auth/channel/bot-sender';
import { SessionService } from '../auth/session.service';
import { sessionConfig } from '../config/session.config';
import { ClaimFreeResult, PackService } from './pack.service';

@ApiTags('packs')
@Controller('packs')
export class PackController {
  constructor(
    private readonly sessions: SessionService,
    private readonly packs: PackService,
    @Inject(BOT_SENDER) private readonly botSender: BotSender,
    @Inject(sessionConfig.KEY)
    private readonly session: ConfigType<typeof sessionConfig>,
  ) {}

  @Get('bot-url')
  @ApiOkResponse({
    schema: {
      properties: { botUrl: { type: 'string', format: 'uri' } },
      required: ['botUrl'],
    },
  })
  async botUrl(): Promise<{ botUrl: string }> {
    const botUrl = await this.botSender.getBotUrl();
    return { botUrl };
  }

  @Post(':packId/claim-free')
  @ApiParam({ name: 'packId' })
  @ApiOkResponse({
    schema: {
      properties: {
        delivered: { type: 'boolean' },
        botUrl: { type: 'string', format: 'uri' },
        alreadyClaimed: { type: 'boolean', nullable: true },
      },
      required: ['delivered', 'botUrl'],
    },
  })
  @ApiUnauthorizedResponse()
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
