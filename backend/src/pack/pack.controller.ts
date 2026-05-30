import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { ConfigType } from '@nestjs/config';
import {
  ApiConsumes,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';

import { BOT_SENDER, type BotSender } from '../auth/channel/bot-sender';
import { SessionService } from '../auth/session.service';
import { sessionConfig } from '../config/session.config';
import {
  ClaimFreeResult,
  DeliverTelegramResult,
  PackDetail,
  PackService,
  PackSummary,
} from './pack.service';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          unlocked: { type: 'boolean' },
          freeCount: { type: 'integer' },
          packSize: { type: 'integer' },
          regensLeft: { type: 'integer' },
          stickers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                index: { type: 'integer' },
                url: { type: 'string' },
              },
              required: ['index', 'url'],
            },
          },
        },
        required: [
          'id',
          'createdAt',
          'status',
          'unlocked',
          'freeCount',
          'packSize',
          'regensLeft',
          'stickers',
        ],
      },
    },
  })
  @ApiUnauthorizedResponse()
  async listMine(@Req() req: Request): Promise<PackSummary[]> {
    const session = await this.resolveSession(req);
    if (!session) throw new UnauthorizedException();
    return this.packs.listPacks(session.userId);
  }

  @Post()
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    schema: {
      properties: { packId: { type: 'string', format: 'uuid' } },
      required: ['packId'],
    },
  })
  @ApiUnauthorizedResponse()
  async create(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ packId: string }> {
    const session = await this.resolveSession(req);
    if (!session) throw new UnauthorizedException();

    if (!file) {
      throw new BadRequestException('image file is required');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('uploaded file must be an image');
    }

    return this.packs.generatePack(session.userId);
  }

  @Get(':packId')
  @ApiParam({ name: 'packId' })
  @ApiOkResponse({
    schema: {
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string' },
        unlocked: { type: 'boolean' },
        freeCount: { type: 'integer' },
        packSize: { type: 'integer' },
        regensLeft: { type: 'integer' },
        stickers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'integer' },
              url: { type: 'string' },
            },
            required: ['index', 'url'],
          },
        },
      },
      required: [
        'id',
        'status',
        'unlocked',
        'freeCount',
        'packSize',
        'regensLeft',
        'stickers',
      ],
    },
  })
  @ApiUnauthorizedResponse()
  async getOne(
    @Param('packId') packId: string,
    @Req() req: Request,
  ): Promise<PackDetail> {
    const session = await this.resolveSession(req);
    if (!session) throw new UnauthorizedException();

    const pack = await this.packs.getPack(packId, session.userId);
    if (!pack) throw new NotFoundException('pack not found');
    return pack;
  }

  @Delete(':packId')
  @HttpCode(204)
  @ApiParam({ name: 'packId' })
  @ApiNoContentResponse({ description: 'Pack deleted' })
  @ApiUnauthorizedResponse()
  async remove(
    @Param('packId') packId: string,
    @Req() req: Request,
  ): Promise<void> {
    const session = await this.resolveSession(req);
    if (!session) throw new UnauthorizedException();

    const deleted = await this.packs.deletePack(packId, session.userId);
    if (!deleted) throw new NotFoundException('pack not found');
  }

  @Post(':packId/deliver-telegram')
  @ApiParam({ name: 'packId' })
  @ApiOkResponse({
    schema: {
      properties: {
        delivered: { type: 'boolean' },
        botUrl: { type: 'string', format: 'uri' },
        needsTelegram: { type: 'boolean', nullable: true },
        stickerSetUrl: { type: 'string', format: 'uri', nullable: true },
      },
      required: ['delivered', 'botUrl'],
    },
  })
  @ApiUnauthorizedResponse()
  async deliverTelegram(
    @Param('packId') packId: string,
    @Req() req: Request,
  ): Promise<DeliverTelegramResult> {
    const session = await this.resolveSession(req);
    if (!session) throw new UnauthorizedException();

    return this.packs.deliverTelegram(packId, session.userId);
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
    const session = await this.resolveSession(req);
    if (!session) throw new UnauthorizedException();

    return this.packs.claimFreeStickers(packId, session.userId);
  }

  private async resolveSession(
    req: Request,
  ): Promise<{ userId: string } | null> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    return this.sessions.resolve(sid);
  }
}
