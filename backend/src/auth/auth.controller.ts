import { randomBytes } from 'node:crypto';

import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';

import { frontendConfig } from '../config/frontend.config';
import { sessionConfig } from '../config/session.config';
import { TelegramMessageService } from '../telegram/telegram-message.service';
import { BOT_SENDER, type BotSender } from './channel/bot-sender';
import { EmailAdapter } from './channel/email-adapter';
import { GoogleAdapter } from './channel/google-adapter';
import { EmailAuthDto } from './dto/email-auth.dto';
import { IdentityService } from './identity.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_LINK_COOKIE = 'oauth_link';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const OAUTH_STATE_BYTES = 16;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly identity: IdentityService,
    private readonly emailAdapter: EmailAdapter,
    private readonly googleAdapter: GoogleAdapter,
    private readonly telegramMessages: TelegramMessageService,
    @Inject(frontendConfig.KEY)
    private readonly frontend: ConfigType<typeof frontendConfig>,
    @Inject(sessionConfig.KEY)
    private readonly session: ConfigType<typeof sessionConfig>,
    @Inject(BOT_SENDER)
    private readonly botSender: BotSender,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get('exchange')
  @ApiQuery({ name: 't', required: false })
  @ApiResponse({
    status: 302,
    description: 'Redirect to post-login path or login-failed',
  })
  async exchange(
    @Query('t') token: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const loginUrl = `${this.frontend.publicAppUrl}/auth/login-failed`;

    if (!token) {
      res.redirect(302, loginUrl);
      return;
    }

    const consumed = await this.tokens.consume(token);
    if (!consumed) {
      res.redirect(302, loginUrl);
      return;
    }

    if (consumed.telegramChatId && consumed.telegramMessageId) {
      this.telegramMessages
        .deleteMessages(consumed.telegramChatId, [
          consumed.telegramMessageId,
          consumed.telegramUserMessageId,
        ])
        .catch(() => {});
    }

    const { sid, expiresAt } = await this.sessions.issue(
      consumed.userId,
      consumed.issuedVia,
    );

    res.cookie(this.session.cookieName, sid, this.cookieOptions(expiresAt));
    res.redirect(
      302,
      `${this.frontend.publicAppUrl}${this.session.postLoginPath}`,
    );
  }

  @Get('me')
  @ApiOkResponse({
    schema: {
      properties: {
        userId: { type: 'string', format: 'uuid' },
        email: { type: 'string', nullable: true },
        displayName: { type: 'string', nullable: true },
        avatarUrl: { type: 'string', nullable: true },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              username: { type: 'string', nullable: true },
              displayName: { type: 'string', nullable: true },
            },
            required: ['channel', 'username', 'displayName'],
          },
        },
      },
      required: ['userId', 'email', 'displayName', 'avatarUrl', 'channels'],
    },
  })
  @ApiUnauthorizedResponse()
  async me(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    userId: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    channels: Array<{
      channel: string;
      username: string | null;
      displayName: string | null;
    }>;
  }> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) {
      // Clear the stale session cookie so the next SSR sees `hasSession()`
      // as false and renders the sign-in CTA directly, avoiding a /auth/me
      // round-trip on every page load.
      if (sid) {
        res.clearCookie(
          this.session.cookieName,
          this.cookieOptions(new Date(0)),
        );
      }
      throw new UnauthorizedException();
    }
    const user = await this.sessions.findUser(session.userId);
    if (!user) {
      res.clearCookie(this.session.cookieName, this.cookieOptions(new Date(0)));
      throw new UnauthorizedException();
    }
    return {
      userId: user.userId,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      channels: user.channels,
    };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Delete('me')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Account permanently deleted' })
  @ApiUnauthorizedResponse()
  async deleteMe(@Req() req: Request, @Res() res: Response): Promise<void> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();
    await this.sessions.deleteUser(session.userId);
    res.clearCookie(this.session.cookieName, this.cookieOptions(new Date(0)));
    res.status(204).send();
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('link/telegram/start')
  @ApiOkResponse({
    schema: {
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  })
  @ApiUnauthorizedResponse()
  async linkTelegramStart(@Req() req: Request): Promise<{ url: string }> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();
    const token = await this.tokens.mintLink(session.userId);
    const botUrl = await this.botSender.getBotUrl();
    return { url: `${botUrl}?start=link_${token}` };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Delete('link/telegram')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Telegram identity unlinked' })
  @ApiResponse({
    status: 409,
    description: 'Cannot remove the last remaining login method',
  })
  @ApiUnauthorizedResponse()
  async unlinkTelegram(@Req() req: Request): Promise<void> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();
    await this.identity.unlinkChannel(session.userId, 'telegram');
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Delete('link/google')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Google identity unlinked' })
  @ApiResponse({
    status: 409,
    description: 'Cannot remove the last remaining login method',
  })
  @ApiUnauthorizedResponse()
  async unlinkGoogle(@Req() req: Request): Promise<void> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();
    await this.identity.unlinkChannel(session.userId, 'google');
  }

  @Post('logout')
  @ApiResponse({ status: 204 })
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    if (sid) await this.sessions.revoke(sid);
    res.clearCookie(this.session.cookieName, this.cookieOptions(new Date(0)));
    res.status(204).send();
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(204)
  @ApiBody({ type: EmailAuthDto })
  @ApiResponse({ status: 204, description: 'Registered and session set' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: EmailAuthDto,
    @Res() res: Response,
  ): Promise<void> {
    const { userId } = await this.emailAdapter.register(
      dto.email,
      dto.password,
    );
    const { sid, expiresAt } = await this.sessions.issue(userId, 'email');
    res.cookie(this.session.cookieName, sid, this.cookieOptions(expiresAt));
    res.status(204).send();
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(204)
  @ApiBody({ type: EmailAuthDto })
  @ApiResponse({ status: 204, description: 'Authenticated and session set' })
  @ApiUnauthorizedResponse()
  async login(@Body() dto: EmailAuthDto, @Res() res: Response): Promise<void> {
    const { userId } = await this.emailAdapter.login(dto.email, dto.password);
    const { sid, expiresAt } = await this.sessions.issue(userId, 'email');
    res.cookie(this.session.cookieName, sid, this.cookieOptions(expiresAt));
    res.status(204).send();
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('google/start')
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
  googleStart(@Res() res: Response): void {
    const state = randomBytes(OAUTH_STATE_BYTES).toString('base64url');
    const stateExpires = new Date(Date.now() + OAUTH_STATE_TTL_MS);

    res.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: this.session.cookieSecure,
      sameSite: 'lax',
      expires: stateExpires,
      path: '/',
    });

    res.redirect(302, this.googleAdapter.buildAuthorizationUrl(state));
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('google/callback')
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiResponse({
    status: 302,
    description: 'Redirect to post-login path or error',
  })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const loginFailedUrl = `${this.frontend.publicAppUrl}/auth/login-failed`;
    const settingsUrl = (status: string) =>
      `${this.frontend.publicAppUrl}/settings?link=google&status=${status}`;

    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const savedState = cookies[OAUTH_STATE_COOKIE];
    const linkMode = cookies[OAUTH_LINK_COOKIE] === '1';

    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });
    res.clearCookie(OAUTH_LINK_COOKIE, { path: '/' });

    if (!code || !state || !savedState || state !== savedState) {
      if (linkMode) {
        res.redirect(302, settingsUrl('error'));
      } else {
        res.redirect(302, loginFailedUrl);
      }
      return;
    }

    try {
      const event = await this.googleAdapter.exchangeCode(code);

      if (linkMode) {
        const sid = cookies[this.session.cookieName];
        const session = await this.sessions.resolve(sid);
        if (!session) {
          res.redirect(302, settingsUrl('error'));
          return;
        }
        await this.identity.linkChannel(session.userId, event);
        res.redirect(302, settingsUrl('connected'));
      } else {
        const { userId } = await this.identity.resolveOrCreate(event);
        const { sid, expiresAt } = await this.sessions.issue(userId, 'google');
        res.cookie(this.session.cookieName, sid, this.cookieOptions(expiresAt));
        res.redirect(
          302,
          `${this.frontend.publicAppUrl}${this.session.postLoginPath}`,
        );
      }
    } catch (err) {
      if (linkMode) {
        if (err instanceof ConflictException) {
          res.redirect(302, settingsUrl('taken'));
        } else {
          res.redirect(302, settingsUrl('error'));
        }
      } else {
        res.redirect(302, loginFailedUrl);
      }
    }
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('link/google/start')
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth or /login',
  })
  async linkGoogleStart(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) {
      res.redirect(302, `${this.frontend.publicAppUrl}/login`);
      return;
    }

    const state = randomBytes(OAUTH_STATE_BYTES).toString('base64url');
    const stateExpires = new Date(Date.now() + OAUTH_STATE_TTL_MS);
    const cookieOpts = {
      httpOnly: true,
      secure: this.session.cookieSecure,
      sameSite: 'lax' as const,
      expires: stateExpires,
      path: '/',
    };

    res.cookie(OAUTH_STATE_COOKIE, state, cookieOpts);
    res.cookie(OAUTH_LINK_COOKIE, '1', cookieOpts);
    res.redirect(302, this.googleAdapter.buildAuthorizationUrl(state));
  }

  private cookieOptions(expires: Date): CookieOptions {
    return {
      httpOnly: true,
      secure: this.session.cookieSecure,
      sameSite: 'lax',
      expires,
      path: '/',
      domain: this.session.cookieDomain,
    };
  }
}
