import { NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { Context, Telegraf } from 'telegraf';

import type { SessionService } from '../../auth/session.service';
import type { sessionConfig } from '../../config/session.config';
import type { PrismaService } from '../../prisma/prisma.service';
import { TelegramAvatarController } from '../telegram-avatar.controller';

const SESSION_STUB = {
  cookieName: 'sid',
  cookieSecure: false,
  postLoginPath: '/my-stickers',
} as unknown as ConfigType<typeof sessionConfig>;

function build(overrides?: {
  resolve?: jest.Mock;
  findUnique?: jest.Mock;
  getUserProfilePhotos?: jest.Mock;
}) {
  const bot = {
    telegram: {
      getUserProfilePhotos:
        overrides?.getUserProfilePhotos ??
        jest.fn().mockResolvedValue({ total_count: 0, photos: [] }),
      getFileLink: jest.fn(),
    },
  } as unknown as Telegraf<Context>;

  const prisma = {
    channelIdentity: {
      findUnique: overrides?.findUnique ?? jest.fn().mockResolvedValue(null),
    },
  } as unknown as PrismaService;

  const sessions = {
    resolve: overrides?.resolve ?? jest.fn().mockResolvedValue(null),
  } as unknown as SessionService;

  const controller = new TelegramAvatarController(
    bot,
    prisma,
    sessions,
    SESSION_STUB,
  );

  return { controller, bot, prisma, sessions };
}

function buildReq(sid?: string): Request {
  return {
    cookies: sid ? { sid } : {},
  } as unknown as Request;
}

function buildRes(): Response & { set: jest.Mock; send: jest.Mock } {
  return {
    set: jest.fn(),
    send: jest.fn(),
  } as unknown as Response & { set: jest.Mock; send: jest.Mock };
}

describe('TelegramAvatarController — getAvatar', () => {
  it('404s on a non-numeric channelUserId without touching the DB', async () => {
    const { controller, prisma } = build();
    await expect(
      controller.getAvatar('abc', buildReq('s'), buildRes()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.channelIdentity.findUnique).not.toHaveBeenCalled();
  });

  it('404s for an anonymous caller (no session) without revealing whether the ID exists', async () => {
    const { controller, prisma, bot } = build({
      resolve: jest.fn().mockResolvedValue(null),
    });
    await expect(
      controller.getAvatar('123', buildReq(), buildRes()),
    ).rejects.toBeInstanceOf(NotFoundException);
    // No identity probe and no Telegram API call for unauthenticated callers.
    expect(prisma.channelIdentity.findUnique).not.toHaveBeenCalled();
    expect(bot.telegram.getUserProfilePhotos).not.toHaveBeenCalled();
  });

  it('404s when the requested ID belongs to a different user (no enumeration)', async () => {
    const { controller, bot } = build({
      resolve: jest.fn().mockResolvedValue({ userId: 'me' }),
      findUnique: jest.fn().mockResolvedValue({ userId: 'someone-else' }),
    });
    await expect(
      controller.getAvatar('123', buildReq('s'), buildRes()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(bot.telegram.getUserProfilePhotos).not.toHaveBeenCalled();
  });

  it('404s for the owner when Telegram reports no profile photo', async () => {
    const { controller } = build({
      resolve: jest.fn().mockResolvedValue({ userId: 'me' }),
      findUnique: jest.fn().mockResolvedValue({ userId: 'me' }),
      getUserProfilePhotos: jest
        .fn()
        .mockResolvedValue({ total_count: 0, photos: [] }),
    });
    await expect(
      controller.getAvatar('123', buildReq('s'), buildRes()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
