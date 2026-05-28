import {
  Controller,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { SessionService } from '../auth/session.service';
import { sessionConfig } from '../config/session.config';
import { PrismaService } from '../prisma/prisma.service';

@Controller('telegram/avatar')
export class TelegramAvatarController {
  private readonly logger = new Logger(TelegramAvatarController.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    @Inject(sessionConfig.KEY)
    private readonly session: ConfigType<typeof sessionConfig>,
  ) {}

  @Get(':channelUserId')
  async getAvatar(
    @Param('channelUserId') channelUserId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!/^\d+$/.test(channelUserId)) {
      throw new NotFoundException('Invalid channelUserId');
    }

    // Only the authenticated owner may fetch their own Telegram avatar.
    // Resolving the session first — and returning an identical 404 for
    // anonymous callers, non-owners, and unknown IDs alike — prevents using
    // this endpoint as an oracle to enumerate which Telegram user IDs are
    // registered Stikup accounts.
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sessionUser = await this.sessions.resolve(
      cookies[this.session.cookieName],
    );
    if (!sessionUser) {
      throw new NotFoundException();
    }

    const identity = await this.prisma.channelIdentity.findUnique({
      where: {
        channel_channelUserId: {
          channel: 'telegram',
          channelUserId,
        },
      },
      select: { userId: true },
    });

    if (!identity || identity.userId !== sessionUser.userId) {
      throw new NotFoundException();
    }

    try {
      const photos = await this.bot.telegram.getUserProfilePhotos(
        Number(channelUserId),
        0,
        1,
      );

      if (photos.total_count === 0) {
        throw new NotFoundException('No profile photo');
      }

      // photos[0] is an array of PhotoSize sorted small→large; pick the largest.
      const sizes = photos.photos[0];
      const largest = sizes[sizes.length - 1];
      const fileLink = await this.bot.telegram.getFileLink(largest.file_id);

      const upstream = await fetch(fileLink.href);
      if (!upstream.ok) {
        throw new Error(`Upstream fetch failed: ${upstream.status}`);
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());
      // Telegram's file CDN serves profile photos as application/octet-stream.
      // Only trust an explicit image/* content-type; otherwise default to JPEG
      // (Telegram profile photos are always JPEG) so the browser renders it.
      const upstreamType = upstream.headers.get('content-type');
      const contentType = upstreamType?.startsWith('image/')
        ? upstreamType
        : 'image/jpeg';

      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Length': String(buffer.length),
      });
      res.send(buffer);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(
        `Failed to proxy avatar for channelUserId=${channelUserId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      throw new NotFoundException('Avatar unavailable');
    }
  }
}
