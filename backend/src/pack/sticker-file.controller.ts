import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { SessionService } from '../auth/session.service';
import { sessionConfig } from '../config/session.config';
import { storageConfig } from '../config/storage.config';
import { PrismaService } from '../prisma/prisma.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Only the source-selfie thumbnail or sticker_1..sticker_99.webp — never a
// traversal path. The numeric capture is the 1-based sticker file number.
const STICKER_FILE_RE = /^sticker_(\d{1,2})\.webp$/;

/**
 * Authenticated, ownership-gated delivery of a pack's on-disk assets. This
 * REPLACES the previous unconditional `useStaticAssets` mount: every pack asset
 * requires a session that OWNS the pack, so one user can never read another
 * user's stickers or source selfie.
 *
 * Locked stickers (index >= freeStickerCount, before the per-pack referral
 * unlock) are served to the owner so the result page and "my stickers" can show
 * the full artwork with a corner lock badge — the referral mechanic gates the
 * *delivery* of the locked stickers to Telegram, not the owner's own preview.
 *
 * The browser-facing URL is `/api/static/packs/<packId>/<file>`; Next.js
 * rewrites `/api/:path*` to the backend, so this controller is mounted at
 * `/static/packs`. Same-origin <img> requests carry the session cookie, so
 * owner auth works transparently.
 */
@ApiExcludeController()
@Controller('static/packs')
export class StickerFileController {
  constructor(
    private readonly sessions: SessionService,
    private readonly prisma: PrismaService,
    @Inject(storageConfig.KEY)
    private readonly storage: ConfigType<typeof storageConfig>,
    @Inject(sessionConfig.KEY)
    private readonly session: ConfigType<typeof sessionConfig>,
  ) {}

  @Get(':packId/:filename')
  async serve(
    @Param('packId') packId: string,
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Owner-only: every pack asset requires a session that owns the pack.
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sess = await this.sessions.resolve(cookies[this.session.cookieName]);
    if (!sess) throw new UnauthorizedException();

    if (!UUID_RE.test(packId)) throw new NotFoundException();

    const isSource = filename === 'source.webp';
    const match = STICKER_FILE_RE.exec(filename);
    if (!isSource && !match) throw new NotFoundException();

    const pack = await this.prisma.pack.findUnique({
      where: { id: packId },
      select: { userId: true },
    });
    if (!pack || pack.userId !== sess.userId) throw new NotFoundException();

    // No per-sticker lock gate: the owner may read every sticker file in their
    // own pack (locked stickers are shown as a full-art preview with a corner
    // lock badge). The filename regex above already constrains `filename` to
    // source.webp or sticker_1..99.webp, so there is no traversal risk.

    const filePath = join(this.storage.stickerDir, packId, filename);
    let size: number;
    try {
      size = (await stat(filePath)).size;
    } catch {
      throw new NotFoundException();
    }

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Length', size);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Owner-private and content-stable (files never change for a packId).
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');

    const stream = createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).end();
      else res.end();
    });
    stream.pipe(res);
  }
}
