import {
  ConflictException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
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

function buildResMock(): jest.Mocked<Response> {
  const res: Partial<jest.Mocked<Response>> = {
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
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

async function buildController(): Promise<AuthController> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      {
        provide: TokenService,
        useValue: {
          consume: jest.fn(),
          mintLink: jest.fn(),
          consumeLink: jest.fn(),
        },
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
        useValue: { attribute: jest.fn().mockResolvedValue(undefined) },
      },
      { provide: frontendConfig.KEY, useValue: FRONTEND_STUB },
      { provide: sessionConfig.KEY, useValue: SESSION_STUB },
      {
        provide: telegramConfig.KEY,
        useValue: { botToken: 'test:token', initDataMaxAgeSec: 86400 },
      },
    ],
  })
    .overridePipe(ValidationPipe)
    .useValue(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )
    .compile();

  return moduleRef.get(AuthController);
}

describe('AuthController — email/google endpoints', () => {
  describe('POST /auth/register', () => {
    it('sets session cookie and returns 204 on success', async () => {
      const controller = await buildController();
      const emailAdapter = (
        controller as unknown as { emailAdapter: jest.Mocked<EmailAdapter> }
      ).emailAdapter;
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (emailAdapter.register as jest.Mock).mockResolvedValueOnce({
        userId: 'u1',
      });
      (sessions.issue as jest.Mock).mockResolvedValueOnce({
        sid: 'sess123',
        expiresAt: new Date(Date.now() + 60_000),
      });

      const req = { cookies: {} } as unknown as import('express').Request;
      const res = buildResMock();
      await controller.register(
        { email: 'test@example.com', password: 'password123' },
        req,
        res,
      );

      expect(emailAdapter.register).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(sessions.issue).toHaveBeenCalledWith('u1', 'email');
      expect(res.cookie).toHaveBeenCalledWith(
        'sid',
        'sess123',
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('propagates ConflictException from EmailAdapter', async () => {
      const controller = await buildController();
      const emailAdapter = (
        controller as unknown as { emailAdapter: jest.Mocked<EmailAdapter> }
      ).emailAdapter;

      (emailAdapter.register as jest.Mock).mockRejectedValueOnce(
        new ConflictException('Email already registered'),
      );

      const req = { cookies: {} } as unknown as import('express').Request;
      const res = buildResMock();
      await expect(
        controller.register(
          { email: 'dup@example.com', password: 'password123' },
          req,
          res,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('POST /auth/login', () => {
    it('sets session cookie and returns 204 on success', async () => {
      const controller = await buildController();
      const emailAdapter = (
        controller as unknown as { emailAdapter: jest.Mocked<EmailAdapter> }
      ).emailAdapter;
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (emailAdapter.login as jest.Mock).mockResolvedValueOnce({ userId: 'u2' });
      (sessions.issue as jest.Mock).mockResolvedValueOnce({
        sid: 'sess456',
        expiresAt: new Date(Date.now() + 60_000),
      });

      const res = buildResMock();
      await controller.login(
        { email: 'user@example.com', password: 'mypassword' },
        res,
      );

      expect(emailAdapter.login).toHaveBeenCalledWith(
        'user@example.com',
        'mypassword',
      );
      expect(sessions.issue).toHaveBeenCalledWith('u2', 'email');
      expect(res.cookie).toHaveBeenCalledWith(
        'sid',
        'sess456',
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('propagates UnauthorizedException from EmailAdapter', async () => {
      const controller = await buildController();
      const emailAdapter = (
        controller as unknown as { emailAdapter: jest.Mocked<EmailAdapter> }
      ).emailAdapter;

      (emailAdapter.login as jest.Mock).mockRejectedValueOnce(
        new UnauthorizedException('Invalid credentials'),
      );

      const res = buildResMock();
      await expect(
        controller.login({ email: 'user@example.com', password: 'wrong' }, res),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('GET /auth/me', () => {
    it('returns userId, email, and channels for a valid session', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce({ userId: 'u99' });
      (sessions.findUser as jest.Mock).mockResolvedValueOnce({
        userId: 'u99',
        email: 'user@example.com',
        displayName: 'user',
        avatarUrl: null,
        channels: [{ channel: 'email', username: null, displayName: 'user' }],
      });

      const req = {
        cookies: { sid: 'valid-sid' },
      } as unknown as import('express').Request;
      const res = buildResMock();

      const result = await controller.me(req, res);

      expect(result).toEqual({
        userId: 'u99',
        email: 'user@example.com',
        displayName: 'user',
        avatarUrl: null,
        channels: [{ channel: 'email', username: null, displayName: 'user' }],
      });
      expect(res.clearCookie).not.toHaveBeenCalled();
    });

    it('returns userId with null email, displayName, and avatarUrl from identity for Google-only user', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce({ userId: 'u88' });
      (sessions.findUser as jest.Mock).mockResolvedValueOnce({
        userId: 'u88',
        email: null,
        displayName: 'Ada Lovelace',
        avatarUrl: 'https://lh3.googleusercontent.com/a/ada',
        channels: [
          {
            channel: 'google',
            username: 'ada@gmail.com',
            displayName: 'Ada Lovelace',
          },
        ],
      });

      const req = {
        cookies: { sid: 'valid-sid' },
      } as unknown as import('express').Request;
      const res = buildResMock();

      const result = await controller.me(req, res);

      expect(result).toEqual({
        userId: 'u88',
        email: null,
        displayName: 'Ada Lovelace',
        avatarUrl: 'https://lh3.googleusercontent.com/a/ada',
        channels: [
          {
            channel: 'google',
            username: 'ada@gmail.com',
            displayName: 'Ada Lovelace',
          },
        ],
      });
    });

    it('clears the stale cookie and throws UnauthorizedException when session is invalid', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce(null);

      const req = {
        cookies: { sid: 'bad-sid' },
      } as unknown as import('express').Request;
      const res = buildResMock();

      await expect(controller.me(req, res)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'sid',
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
    });

    it('throws UnauthorizedException without clearing cookie when no cookie is present', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce(null);

      const req = { cookies: {} } as unknown as import('express').Request;
      const res = buildResMock();

      await expect(controller.me(req, res)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(res.clearCookie).not.toHaveBeenCalled();
    });

    it('clears the cookie and throws UnauthorizedException when user row is missing', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce({
        userId: 'ghost',
      });
      (sessions.findUser as jest.Mock).mockResolvedValueOnce(null);

      const req = {
        cookies: { sid: 'orphan-sid' },
      } as unknown as import('express').Request;
      const res = buildResMock();

      await expect(controller.me(req, res)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'sid',
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
    });
  });

  describe('GET /auth/google/start', () => {
    it('sets oauth_state cookie and redirects to Google auth URL', async () => {
      const controller = await buildController();
      const googleAdapter = (
        controller as unknown as { googleAdapter: jest.Mocked<GoogleAdapter> }
      ).googleAdapter;

      (googleAdapter.buildAuthorizationUrl as jest.Mock).mockReturnValueOnce(
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=x',
      );

      const res = buildResMock();
      controller.googleStart(res);

      expect(googleAdapter.buildAuthorizationUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^[A-Za-z0-9_-]+$/),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'oauth_state',
        expect.any(String),
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=x',
      );
    });
  });

  describe('DELETE /auth/me', () => {
    it('throws UnauthorizedException when no session cookie is present', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce(null);

      const req = {
        cookies: {},
      } as unknown as import('express').Request;
      const res = buildResMock();

      await expect(controller.deleteMe(req, res)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(sessions.deleteUser).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when session cookie is invalid', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce(null);

      const req = {
        cookies: { sid: 'bad-sid' },
      } as unknown as import('express').Request;
      const res = buildResMock();

      await expect(controller.deleteMe(req, res)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(sessions.deleteUser).not.toHaveBeenCalled();
    });

    it('deletes the user, clears the cookie, and returns 204 for an authenticated request', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce({
        userId: 'u-del',
      });
      (sessions.deleteUser as jest.Mock).mockResolvedValueOnce(undefined);

      const req = {
        cookies: { sid: 'valid-sid' },
      } as unknown as import('express').Request;
      const res = buildResMock();

      await controller.deleteMe(req, res);

      expect(sessions.resolve).toHaveBeenCalledWith('valid-sid');
      expect(sessions.deleteUser).toHaveBeenCalledWith('u-del');
      expect(res.clearCookie).toHaveBeenCalledWith(
        'sid',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe('GET /auth/google/callback', () => {
    it('redirects to login-failed when state mismatch', async () => {
      const controller = await buildController();
      const res = buildResMock();
      const req = {
        cookies: { oauth_state: 'abc' },
      } as unknown as import('express').Request;

      await controller.googleCallback('code123', 'wrong-state', req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/auth/login-failed',
      );
    });

    it('redirects to login-failed when code is missing', async () => {
      const controller = await buildController();
      const res = buildResMock();
      const req = {
        cookies: { oauth_state: 'abc' },
      } as unknown as import('express').Request;

      await controller.googleCallback(undefined, 'abc', req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/auth/login-failed',
      );
    });

    it('issues session and redirects to post-login path on success', async () => {
      const controller = await buildController();
      const googleAdapter = (
        controller as unknown as { googleAdapter: jest.Mocked<GoogleAdapter> }
      ).googleAdapter;
      const identity = (
        controller as unknown as { identity: jest.Mocked<IdentityService> }
      ).identity;
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      const event = {
        channel: 'google' as const,
        channelUserId: 'google-sub',
        profile: { displayName: 'Alice', username: 'alice@gmail.com' },
      };
      (googleAdapter.exchangeCode as jest.Mock).mockResolvedValueOnce(event);
      (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
        userId: 'u3',
        created: false,
      });
      (sessions.issue as jest.Mock).mockResolvedValueOnce({
        sid: 'sess789',
        expiresAt: new Date(Date.now() + 60_000),
      });

      const res = buildResMock();
      const req = {
        cookies: { oauth_state: 'state-xyz' },
      } as unknown as import('express').Request;

      await controller.googleCallback('authcode', 'state-xyz', req, res);

      expect(googleAdapter.exchangeCode).toHaveBeenCalledWith('authcode');
      expect(identity.resolveOrCreate).toHaveBeenCalledWith(event);
      expect(sessions.issue).toHaveBeenCalledWith('u3', 'google');
      expect(res.cookie).toHaveBeenCalledWith(
        'sid',
        'sess789',
        expect.any(Object),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/my-stickers',
      );
    });

    it('redirects to login-failed when Google exchange throws', async () => {
      const controller = await buildController();
      const googleAdapter = (
        controller as unknown as { googleAdapter: jest.Mocked<GoogleAdapter> }
      ).googleAdapter;

      (googleAdapter.exchangeCode as jest.Mock).mockRejectedValueOnce(
        new UnauthorizedException('Google token exchange failed'),
      );

      const res = buildResMock();
      const req = {
        cookies: { oauth_state: 'state-xyz' },
      } as unknown as import('express').Request;

      await controller.googleCallback('bad-code', 'state-xyz', req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/auth/login-failed',
      );
    });
  });

  describe('GET /auth/exchange', () => {
    it('redirects to login-failed when token is missing', async () => {
      const controller = await buildController();
      const res = buildResMock();

      await controller.exchange(undefined, res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/auth/login-failed',
      );
    });

    it('redirects to login-failed when token is invalid', async () => {
      const controller = await buildController();
      const tokens = (
        controller as unknown as { tokens: jest.Mocked<TokenService> }
      ).tokens;

      (tokens.consume as jest.Mock).mockResolvedValueOnce(null);

      const res = buildResMock();
      await controller.exchange('bad-token', res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/auth/login-failed',
      );
    });

    it('issues session and redirects for a non-Telegram token without calling deleteMessages', async () => {
      const controller = await buildController();
      const tokens = (
        controller as unknown as { tokens: jest.Mocked<TokenService> }
      ).tokens;
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;
      const telegramMessages = (
        controller as unknown as {
          telegramMessages: jest.Mocked<TelegramMessageService>;
        }
      ).telegramMessages;

      (tokens.consume as jest.Mock).mockResolvedValueOnce({
        userId: 'u-email',
        issuedVia: 'email',
      });
      (sessions.issue as jest.Mock).mockResolvedValueOnce({
        sid: 'sess-email',
        expiresAt: new Date(Date.now() + 60_000),
      });

      const res = buildResMock();
      await controller.exchange('valid-email-token', res);

      expect(sessions.issue).toHaveBeenCalledWith('u-email', 'email');
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/my-stickers',
      );
      expect(telegramMessages.deleteMessages).not.toHaveBeenCalled();
    });

    it('deletes both bot and user messages when both ids are present', async () => {
      const controller = await buildController();
      const tokens = (
        controller as unknown as { tokens: jest.Mocked<TokenService> }
      ).tokens;
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;
      const telegramMessages = (
        controller as unknown as {
          telegramMessages: jest.Mocked<TelegramMessageService>;
        }
      ).telegramMessages;

      (tokens.consume as jest.Mock).mockResolvedValueOnce({
        userId: 'u-tg',
        issuedVia: 'telegram',
        telegramChatId: BigInt(123456789),
        telegramMessageId: 42,
        telegramUserMessageId: 41,
      });
      (sessions.issue as jest.Mock).mockResolvedValueOnce({
        sid: 'sess-tg',
        expiresAt: new Date(Date.now() + 60_000),
      });

      const res = buildResMock();
      await controller.exchange('valid-tg-token', res);

      expect(sessions.issue).toHaveBeenCalledWith('u-tg', 'telegram');
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/my-stickers',
      );
      expect(telegramMessages.deleteMessages).toHaveBeenCalledWith(
        BigInt(123456789),
        [42, 41],
      );
    });

    it('deletes only the bot message when user message id is absent', async () => {
      const controller = await buildController();
      const tokens = (
        controller as unknown as { tokens: jest.Mocked<TokenService> }
      ).tokens;
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;
      const telegramMessages = (
        controller as unknown as {
          telegramMessages: jest.Mocked<TelegramMessageService>;
        }
      ).telegramMessages;

      (tokens.consume as jest.Mock).mockResolvedValueOnce({
        userId: 'u-tg2',
        issuedVia: 'telegram',
        telegramChatId: BigInt(987654321),
        telegramMessageId: 99,
      });
      (sessions.issue as jest.Mock).mockResolvedValueOnce({
        sid: 'sess-tg2',
        expiresAt: new Date(Date.now() + 60_000),
      });

      const res = buildResMock();
      await controller.exchange('valid-tg-token-2', res);

      expect(telegramMessages.deleteMessages).toHaveBeenCalledWith(
        BigInt(987654321),
        [99, undefined],
      );
    });
  });

  describe('POST /auth/link/telegram/start', () => {
    it('throws UnauthorizedException when no valid session', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce(null);

      const req = { cookies: {} } as unknown as import('express').Request;
      await expect(controller.linkTelegramStart(req)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns a deep-link url for an authenticated user', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;
      const tokens = (
        controller as unknown as { tokens: jest.Mocked<TokenService> }
      ).tokens;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce({
        userId: 'u-link',
      });
      (tokens.mintLink as jest.Mock).mockResolvedValueOnce('link-token-abc');

      const req = {
        cookies: { sid: 'valid-sid' },
      } as unknown as import('express').Request;

      const result = await controller.linkTelegramStart(req);

      expect(tokens.mintLink).toHaveBeenCalledWith('u-link');
      expect(result).toEqual({
        url: 'https://t.me/stikup_bot?start=link_link-token-abc',
      });
    });
  });

  describe('DELETE /auth/link/telegram', () => {
    it('throws UnauthorizedException when no valid session', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce(null);

      const req = { cookies: {} } as unknown as import('express').Request;
      await expect(controller.unlinkTelegram(req)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('calls unlinkChannel with telegram and returns undefined (204)', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;
      const identity = (
        controller as unknown as { identity: jest.Mocked<IdentityService> }
      ).identity;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce({
        userId: 'u-unlink',
      });
      (identity.unlinkChannel as jest.Mock).mockResolvedValueOnce(undefined);

      const req = {
        cookies: { sid: 'valid-sid' },
      } as unknown as import('express').Request;

      await expect(controller.unlinkTelegram(req)).resolves.toBeUndefined();
      expect(identity.unlinkChannel).toHaveBeenCalledWith(
        'u-unlink',
        'telegram',
      );
    });

    it('propagates ConflictException from unlinkChannel (last_login_method)', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;
      const identity = (
        controller as unknown as { identity: jest.Mocked<IdentityService> }
      ).identity;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce({
        userId: 'u-last',
      });
      (identity.unlinkChannel as jest.Mock).mockRejectedValueOnce(
        new ConflictException('last_login_method'),
      );

      const req = {
        cookies: { sid: 'valid-sid' },
      } as unknown as import('express').Request;

      await expect(controller.unlinkTelegram(req)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('GET /auth/link/google/start', () => {
    it('redirects to /login when no valid session', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce(null);

      const req = { cookies: {} } as unknown as import('express').Request;
      const res = buildResMock();

      await controller.linkGoogleStart(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/login',
      );
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('sets both cookies and redirects to Google auth URL when session is valid', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;
      const googleAdapter = (
        controller as unknown as { googleAdapter: jest.Mocked<GoogleAdapter> }
      ).googleAdapter;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce({
        userId: 'u-link',
      });
      (googleAdapter.buildAuthorizationUrl as jest.Mock).mockReturnValueOnce(
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=x',
      );

      const req = {
        cookies: { sid: 'valid-sid' },
      } as unknown as import('express').Request;
      const res = buildResMock();

      await controller.linkGoogleStart(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'oauth_state',
        expect.stringMatching(/^[A-Za-z0-9_-]+$/),
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'oauth_link',
        '1',
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'https://accounts.google.com/o/oauth2/v2/auth?client_id=x',
      );
    });
  });

  describe('GET /auth/google/callback (link mode)', () => {
    it('calls linkChannel and redirects to /settings?link=google&status=connected on success', async () => {
      const controller = await buildController();
      const googleAdapter = (
        controller as unknown as { googleAdapter: jest.Mocked<GoogleAdapter> }
      ).googleAdapter;
      const identity = (
        controller as unknown as { identity: jest.Mocked<IdentityService> }
      ).identity;
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      const event = {
        channel: 'google' as const,
        channelUserId: 'google-sub',
        profile: { displayName: 'Alice', username: 'alice@gmail.com' },
      };
      (googleAdapter.exchangeCode as jest.Mock).mockResolvedValueOnce(event);
      // resolve is called once for the session lookup inside link mode
      (sessions.resolve as jest.Mock).mockResolvedValueOnce({
        userId: 'u-linked',
      });
      (identity.linkChannel as jest.Mock).mockResolvedValueOnce({
        status: 'linked',
      });

      const res = buildResMock();
      const req = {
        cookies: {
          oauth_state: 'state-link',
          oauth_link: '1',
          sid: 'valid-sid',
        },
      } as unknown as import('express').Request;

      await controller.googleCallback('authcode', 'state-link', req, res);

      expect(identity.linkChannel).toHaveBeenCalledWith('u-linked', event);
      expect(identity.resolveOrCreate).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/settings?link=google&status=connected',
      );
    });

    it('redirects to status=taken when linkChannel throws ConflictException', async () => {
      const controller = await buildController();
      const googleAdapter = (
        controller as unknown as { googleAdapter: jest.Mocked<GoogleAdapter> }
      ).googleAdapter;
      const identity = (
        controller as unknown as { identity: jest.Mocked<IdentityService> }
      ).identity;
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (googleAdapter.exchangeCode as jest.Mock).mockResolvedValueOnce({
        channel: 'google' as const,
        channelUserId: 'taken-sub',
        profile: { displayName: 'Bob', username: 'bob@gmail.com' },
      });
      (sessions.resolve as jest.Mock).mockResolvedValueOnce({ userId: 'u-b' });
      (identity.linkChannel as jest.Mock).mockRejectedValueOnce(
        new ConflictException('channel_taken'),
      );

      const res = buildResMock();
      const req = {
        cookies: { oauth_state: 'state-t', oauth_link: '1', sid: 'valid-sid' },
      } as unknown as import('express').Request;

      await controller.googleCallback('code', 'state-t', req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/settings?link=google&status=taken',
      );
    });

    it('redirects to status=error when session is missing in link mode', async () => {
      const controller = await buildController();
      const googleAdapter = (
        controller as unknown as { googleAdapter: jest.Mocked<GoogleAdapter> }
      ).googleAdapter;
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (googleAdapter.exchangeCode as jest.Mock).mockResolvedValueOnce({
        channel: 'google' as const,
        channelUserId: 'some-sub',
        profile: { displayName: 'X', username: 'x@gmail.com' },
      });
      (sessions.resolve as jest.Mock).mockResolvedValueOnce(null);

      const res = buildResMock();
      const req = {
        cookies: { oauth_state: 'state-ns', oauth_link: '1' },
      } as unknown as import('express').Request;

      await controller.googleCallback('code', 'state-ns', req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/settings?link=google&status=error',
      );
    });

    it('redirects to status=error when exchange throws in link mode', async () => {
      const controller = await buildController();
      const googleAdapter = (
        controller as unknown as { googleAdapter: jest.Mocked<GoogleAdapter> }
      ).googleAdapter;

      (googleAdapter.exchangeCode as jest.Mock).mockRejectedValueOnce(
        new Error('network error'),
      );

      const res = buildResMock();
      const req = {
        cookies: { oauth_state: 'state-ex', oauth_link: '1', sid: 'valid-sid' },
      } as unknown as import('express').Request;

      await controller.googleCallback('code', 'state-ex', req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/settings?link=google&status=error',
      );
    });

    it('redirects to status=error on state mismatch in link mode', async () => {
      const controller = await buildController();

      const res = buildResMock();
      const req = {
        cookies: { oauth_state: 'state-abc', oauth_link: '1' },
      } as unknown as import('express').Request;

      await controller.googleCallback('code', 'wrong-state', req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/settings?link=google&status=error',
      );
    });
  });

  describe('GET /auth/google/callback (normal login mode — regression)', () => {
    it('issues session and redirects to post-login path (unchanged behavior)', async () => {
      const controller = await buildController();
      const googleAdapter = (
        controller as unknown as { googleAdapter: jest.Mocked<GoogleAdapter> }
      ).googleAdapter;
      const identity = (
        controller as unknown as { identity: jest.Mocked<IdentityService> }
      ).identity;
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      const event = {
        channel: 'google' as const,
        channelUserId: 'google-sub-reg',
        profile: { displayName: 'Carol', username: 'carol@gmail.com' },
      };
      (googleAdapter.exchangeCode as jest.Mock).mockResolvedValueOnce(event);
      (identity.resolveOrCreate as jest.Mock).mockResolvedValueOnce({
        userId: 'u-reg',
        created: false,
      });
      (sessions.issue as jest.Mock).mockResolvedValueOnce({
        sid: 'sess-reg',
        expiresAt: new Date(Date.now() + 60_000),
      });

      const res = buildResMock();
      // No oauth_link cookie — normal login flow
      const req = {
        cookies: { oauth_state: 'state-reg' },
      } as unknown as import('express').Request;

      await controller.googleCallback('authcode-reg', 'state-reg', req, res);

      expect(identity.resolveOrCreate).toHaveBeenCalledWith(event);
      expect(identity.linkChannel).not.toHaveBeenCalled();
      expect(sessions.issue).toHaveBeenCalledWith('u-reg', 'google');
      expect(res.cookie).toHaveBeenCalledWith(
        'sid',
        'sess-reg',
        expect.any(Object),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        'http://localhost:3000/my-stickers',
      );
    });
  });

  describe('DELETE /auth/link/google', () => {
    it('throws UnauthorizedException when no valid session', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce(null);

      const req = { cookies: {} } as unknown as import('express').Request;
      await expect(controller.unlinkGoogle(req)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('calls unlinkChannel with google and returns undefined (204)', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;
      const identity = (
        controller as unknown as { identity: jest.Mocked<IdentityService> }
      ).identity;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce({
        userId: 'u-unlink-g',
      });
      (identity.unlinkChannel as jest.Mock).mockResolvedValueOnce(undefined);

      const req = {
        cookies: { sid: 'valid-sid' },
      } as unknown as import('express').Request;

      await expect(controller.unlinkGoogle(req)).resolves.toBeUndefined();
      expect(identity.unlinkChannel).toHaveBeenCalledWith(
        'u-unlink-g',
        'google',
      );
    });

    it('propagates ConflictException from unlinkChannel (last_login_method)', async () => {
      const controller = await buildController();
      const sessions = (
        controller as unknown as { sessions: jest.Mocked<SessionService> }
      ).sessions;
      const identity = (
        controller as unknown as { identity: jest.Mocked<IdentityService> }
      ).identity;

      (sessions.resolve as jest.Mock).mockResolvedValueOnce({
        userId: 'u-last-g',
      });
      (identity.unlinkChannel as jest.Mock).mockRejectedValueOnce(
        new ConflictException('last_login_method'),
      );

      const req = {
        cookies: { sid: 'valid-sid' },
      } as unknown as import('express').Request;

      await expect(controller.unlinkGoogle(req)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
