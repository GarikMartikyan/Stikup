import { createHmac } from 'node:crypto';

import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Response } from 'express';

import { frontendConfig } from '../../config/frontend.config';
import { sessionConfig } from '../../config/session.config';
import { telegramConfig } from '../../config/telegram.config';
import { ReferralService } from '../../referral/referral.service';
import { TelegramMessageService } from '../../telegram/telegram-message.service';
import { AuthController } from '../auth.controller';
import { BOT_SENDER } from '../channel/bot-sender';
import { EmailAdapter } from '../channel/email-adapter';
import { GoogleAdapter } from '../channel/google-adapter';
import { IdentityService } from '../identity.service';
import { SessionService } from '../session.service';
import { TokenService } from '../token.service';

const FAKE_BOT_TOKEN = 'test:TelegramBotToken';

function buildInitData(
  fields: Record<string, string>,
  botToken: string = FAKE_BOT_TOKEN,
  authDateOverride?: number,
): string {
  const authDate = authDateOverride ?? Math.floor(Date.now() / 1000) - 5;
  const allFields: Record<string, string> = {
    auth_date: String(authDate),
    ...fields,
  };
  const sorted = Object.entries(allFields).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const dataCheckString = sorted.map(([k, v]) => `${k}=${v}`).join('\n');
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const hash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  const params = new URLSearchParams({ ...allFields, hash });
  return params.toString();
}

const VALID_USER_JSON = JSON.stringify({
  id: 42,
  first_name: 'Test',
  username: 'testuser',
});

const PACK_UUID = '550e8400-e29b-41d4-a716-446655440000';

function buildResMock(): jest.Mocked<Response> {
  const res: Partial<jest.Mocked<Response>> = {
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as jest.Mocked<Response>;
}

const FRONTEND_STUB = { publicAppUrl: 'http://localhost:3000' };
const SESSION_STUB = {
  cookieName: 'sid',
  cookieDomain: undefined,
  cookieSecure: false,
  postLoginPath: '/my-stickers',
};
const TELEGRAM_STUB = {
  botToken: FAKE_BOT_TOKEN,
  initDataMaxAgeSec: 86400,
};

async function buildController(): Promise<AuthController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      {
        provide: TokenService,
        useValue: { consume: jest.fn(), mintLink: jest.fn() },
      },
      {
        provide: SessionService,
        useValue: {
          issue: jest.fn(),
          resolve: jest.fn(),
          revoke: jest.fn(),
          findUser: jest.fn(),
          deleteUser: jest.fn(),
        },
      },
      {
        provide: IdentityService,
        useValue: {
          resolveOrCreate: jest.fn(),
          linkChannel: jest.fn(),
          unlinkChannel: jest.fn(),
        },
      },
      {
        provide: EmailAdapter,
        useValue: { register: jest.fn(), login: jest.fn() },
      },
      {
        provide: GoogleAdapter,
        useValue: {
          buildAuthorizationUrl: jest.fn(),
          exchangeCode: jest.fn(),
        },
      },
      {
        provide: TelegramMessageService,
        useValue: {
          deleteMessage: jest.fn().mockResolvedValue(undefined),
          deleteMessages: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: BOT_SENDER,
        useValue: {
          getBotUrl: jest.fn().mockResolvedValue('https://t.me/stikup_bot'),
        },
      },
      {
        provide: ReferralService,
        useValue: {
          attribute: jest.fn().mockResolvedValue(undefined),
          consumePending: jest.fn().mockResolvedValue(null),
        },
      },
      { provide: frontendConfig.KEY, useValue: FRONTEND_STUB },
      { provide: sessionConfig.KEY, useValue: SESSION_STUB },
      { provide: telegramConfig.KEY, useValue: TELEGRAM_STUB },
    ],
  })
    .overridePipe(ValidationPipe)
    .useValue(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )
    .compile();

  return moduleRef.get(AuthController);
}

describe('AuthController — POST /auth/telegram/webapp', () => {
  it('sets session cookie and returns the user profile on valid initData', async () => {
    const controller = await buildController();
    const identity = (
      controller as unknown as { identity: jest.Mocked<IdentityService> }
    ).identity;
    const sessions = (
      controller as unknown as { sessions: jest.Mocked<SessionService> }
    ).sessions;

    (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
      userId: 'u-tg-webapp',
      created: false,
    });
    (sessions.issue as jest.Mock).mockResolvedValueOnce({
      sid: 'sess-webapp',
      expiresAt: new Date(Date.now() + 60_000),
    });
    const profile = {
      userId: 'u-tg-webapp',
      email: null,
      displayName: 'Test',
      avatarUrl: null,
      channels: [
        { channel: 'telegram', username: 'testuser', displayName: 'Test' },
      ],
    };
    (sessions.findUser as jest.Mock).mockResolvedValueOnce(profile);

    const initData = buildInitData({ user: VALID_USER_JSON });
    const req = { cookies: {} } as unknown as import('express').Request;
    const res = buildResMock();

    await controller.telegramWebApp({ initData }, req, res);

    expect(identity.resolveOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'telegram', channelUserId: '42' }),
    );
    expect(sessions.issue).toHaveBeenCalledWith('u-tg-webapp', 'telegram');
    expect(res.cookie).toHaveBeenCalledWith(
      'sid',
      'sess-webapp',
      expect.any(Object),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(profile);
  });

  it('attributes referral from start_param when user is newly created', async () => {
    const controller = await buildController();
    const identity = (
      controller as unknown as { identity: jest.Mocked<IdentityService> }
    ).identity;
    const sessions = (
      controller as unknown as { sessions: jest.Mocked<SessionService> }
    ).sessions;
    const referrals = (
      controller as unknown as { referrals: jest.Mocked<ReferralService> }
    ).referrals;

    (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
      userId: 'u-new',
      created: true,
    });
    (sessions.issue as jest.Mock).mockResolvedValueOnce({
      sid: 'sess-new',
      expiresAt: new Date(Date.now() + 60_000),
    });
    (sessions.findUser as jest.Mock).mockResolvedValueOnce({
      userId: 'u-new',
      email: null,
      displayName: null,
      avatarUrl: null,
      channels: [],
    });

    const initData = buildInitData({
      user: VALID_USER_JSON,
      start_param: `MYCODE_${PACK_UUID}`,
    });
    const req = { cookies: {} } as unknown as import('express').Request;
    const res = buildResMock();

    await controller.telegramWebApp({ initData }, req, res);

    expect(referrals.attribute).toHaveBeenCalledWith(
      'u-new',
      'MYCODE',
      'telegram',
      PACK_UUID,
    );
  });

  it('does not attribute when newly created but start_param is absent', async () => {
    const controller = await buildController();
    const identity = (
      controller as unknown as { identity: jest.Mocked<IdentityService> }
    ).identity;
    const sessions = (
      controller as unknown as { sessions: jest.Mocked<SessionService> }
    ).sessions;
    const referrals = (
      controller as unknown as { referrals: jest.Mocked<ReferralService> }
    ).referrals;

    (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
      userId: 'u-new-noref',
      created: true,
    });
    (sessions.issue as jest.Mock).mockResolvedValueOnce({
      sid: 'sess-new-noref',
      expiresAt: new Date(Date.now() + 60_000),
    });
    (sessions.findUser as jest.Mock).mockResolvedValueOnce({
      userId: 'u-new-noref',
      email: null,
      displayName: null,
      avatarUrl: null,
      channels: [],
    });

    const initData = buildInitData({ user: VALID_USER_JSON });
    const req = { cookies: {} } as unknown as import('express').Request;
    const res = buildResMock();

    await controller.telegramWebApp({ initData }, req, res);

    expect(referrals.attribute).not.toHaveBeenCalled();
  });

  it('does not attribute referral when user already existed', async () => {
    const controller = await buildController();
    const identity = (
      controller as unknown as { identity: jest.Mocked<IdentityService> }
    ).identity;
    const sessions = (
      controller as unknown as { sessions: jest.Mocked<SessionService> }
    ).sessions;
    const referrals = (
      controller as unknown as { referrals: jest.Mocked<ReferralService> }
    ).referrals;

    (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
      userId: 'u-existing',
      created: false,
    });
    (sessions.issue as jest.Mock).mockResolvedValueOnce({
      sid: 'sess-existing',
      expiresAt: new Date(Date.now() + 60_000),
    });
    (sessions.findUser as jest.Mock).mockResolvedValueOnce({
      userId: 'u-existing',
      email: null,
      displayName: null,
      avatarUrl: null,
      channels: [],
    });

    const initData = buildInitData({
      user: VALID_USER_JSON,
      start_param: `MYCODE_${PACK_UUID}`,
    });
    const req = { cookies: {} } as unknown as import('express').Request;
    const res = buildResMock();

    await controller.telegramWebApp({ initData }, req, res);

    expect(referrals.attribute).not.toHaveBeenCalled();
  });

  it('returns 401 when initData has an invalid hash', async () => {
    const controller = await buildController();
    const identity = (
      controller as unknown as { identity: jest.Mocked<IdentityService> }
    ).identity;

    const badInitData = buildInitData({ user: VALID_USER_JSON }).replace(
      /hash=[0-9a-f]+/,
      'hash=0000000000000000000000000000000000000000000000000000000000000000',
    );
    const req = { cookies: {} } as unknown as import('express').Request;
    const res = buildResMock();

    await controller.telegramWebApp({ initData: badInitData }, req, res);

    expect(identity.resolveOrCreate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false });
  });

  it('returns 401 when initData is empty', async () => {
    const controller = await buildController();
    const req = { cookies: {} } as unknown as import('express').Request;
    const res = buildResMock();

    await controller.telegramWebApp({ initData: 'junk_no_hash' }, req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false });
  });

  it('throws UnauthorizedException when findUser returns null after session issue', async () => {
    const controller = await buildController();
    const identity = (
      controller as unknown as { identity: jest.Mocked<IdentityService> }
    ).identity;
    const sessions = (
      controller as unknown as { sessions: jest.Mocked<SessionService> }
    ).sessions;

    (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
      userId: 'u-race',
      created: false,
    });
    (sessions.issue as jest.Mock).mockResolvedValueOnce({
      sid: 'sess-race',
      expiresAt: new Date(Date.now() + 60_000),
    });
    // Simulate the race: user deleted between session issue and findUser.
    (sessions.findUser as jest.Mock).mockResolvedValueOnce(null);

    const initData = buildInitData({ user: VALID_USER_JSON });
    const req = { cookies: {} } as unknown as import('express').Request;
    const res = buildResMock();

    await expect(
      controller.telegramWebApp({ initData }, req, res),
    ).rejects.toThrow('Unauthorized');

    expect(res.clearCookie).toHaveBeenCalled();
  });

  it('attributes referral from pending row when start_param is absent but pending exists', async () => {
    const controller = await buildController();
    const identity = (
      controller as unknown as { identity: jest.Mocked<IdentityService> }
    ).identity;
    const sessions = (
      controller as unknown as { sessions: jest.Mocked<SessionService> }
    ).sessions;
    const referrals = (
      controller as unknown as { referrals: jest.Mocked<ReferralService> }
    ).referrals;

    (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
      userId: 'u-new',
      created: true,
    });
    (sessions.issue as jest.Mock).mockResolvedValueOnce({
      sid: 'sess-new',
      expiresAt: new Date(Date.now() + 60_000),
    });
    (sessions.findUser as jest.Mock).mockResolvedValueOnce({
      userId: 'u-new',
      email: null,
      displayName: null,
      avatarUrl: null,
      channels: [],
    });
    (referrals.consumePending as jest.Mock).mockResolvedValueOnce({
      code: 'MYCODE',
      packId: PACK_UUID,
    });

    // No start_param in the initData
    const initData = buildInitData({ user: VALID_USER_JSON });
    const req = { cookies: {} } as unknown as import('express').Request;
    const res = buildResMock();

    await controller.telegramWebApp({ initData }, req, res);

    expect(referrals.consumePending).toHaveBeenCalledWith('telegram', '42');
    expect(referrals.attribute).toHaveBeenCalledWith(
      'u-new',
      'MYCODE',
      'telegram',
      PACK_UUID,
    );
  });

  it('prefers start_param over pending row when both are present, still consumes pending for cleanup', async () => {
    const controller = await buildController();
    const identity = (
      controller as unknown as { identity: jest.Mocked<IdentityService> }
    ).identity;
    const sessions = (
      controller as unknown as { sessions: jest.Mocked<SessionService> }
    ).sessions;
    const referrals = (
      controller as unknown as { referrals: jest.Mocked<ReferralService> }
    ).referrals;

    (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
      userId: 'u-new',
      created: true,
    });
    (sessions.issue as jest.Mock).mockResolvedValueOnce({
      sid: 'sess-new',
      expiresAt: new Date(Date.now() + 60_000),
    });
    (sessions.findUser as jest.Mock).mockResolvedValueOnce({
      userId: 'u-new',
      email: null,
      displayName: null,
      avatarUrl: null,
      channels: [],
    });
    // Pending row exists but start_param should win
    (referrals.consumePending as jest.Mock).mockResolvedValueOnce({
      code: 'PENDINGCODE',
      packId: null,
    });

    const initData = buildInitData({
      user: VALID_USER_JSON,
      start_param: `STARTPARAMCODE_${PACK_UUID}`,
    });
    const req = { cookies: {} } as unknown as import('express').Request;
    const res = buildResMock();

    await controller.telegramWebApp({ initData }, req, res);

    // consumePending always called for cleanup when created=true
    expect(referrals.consumePending).toHaveBeenCalledWith('telegram', '42');
    // attribute uses start_param values, not the pending row
    expect(referrals.attribute).toHaveBeenCalledWith(
      'u-new',
      'STARTPARAMCODE',
      'telegram',
      PACK_UUID,
    );
  });

  it('does not call consumePending when user already existed (created=false)', async () => {
    const controller = await buildController();
    const identity = (
      controller as unknown as { identity: jest.Mocked<IdentityService> }
    ).identity;
    const sessions = (
      controller as unknown as { sessions: jest.Mocked<SessionService> }
    ).sessions;
    const referrals = (
      controller as unknown as { referrals: jest.Mocked<ReferralService> }
    ).referrals;

    (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
      userId: 'u-existing',
      created: false,
    });
    (sessions.issue as jest.Mock).mockResolvedValueOnce({
      sid: 'sess-existing',
      expiresAt: new Date(Date.now() + 60_000),
    });
    (sessions.findUser as jest.Mock).mockResolvedValueOnce({
      userId: 'u-existing',
      email: null,
      displayName: null,
      avatarUrl: null,
      channels: [],
    });

    const initData = buildInitData({
      user: VALID_USER_JSON,
      start_param: `MYCODE_${PACK_UUID}`,
    });
    const req = { cookies: {} } as unknown as import('express').Request;
    const res = buildResMock();

    await controller.telegramWebApp({ initData }, req, res);

    expect(referrals.consumePending).not.toHaveBeenCalled();
    expect(referrals.attribute).not.toHaveBeenCalled();
  });
});
