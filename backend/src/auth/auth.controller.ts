import { randomBytes } from 'node:crypto';

import {
  Body,
  Controller,
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
import { EmailAdapter } from './channel/email-adapter';
import { GoogleAdapter } from './channel/google-adapter';
import { EmailAuthDto } from './dto/email-auth.dto';
import { IdentityService } from './identity.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

const OAUTH_STATE_COOKIE = 'oauth_state';
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
    @Inject(frontendConfig.KEY)
    private readonly frontend: ConfigType<typeof frontendConfig>,
    @Inject(sessionConfig.KEY)
    private readonly session: ConfigType<typeof sessionConfig>,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get('exchange')
  @ApiQuery({ name: 't', required: false })
  @ApiResponse({
    status: 302,
    description: 'Redirect to dashboard or login-failed',
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
      properties: { userId: { type: 'string', format: 'uuid' } },
      required: ['userId'],
    },
  })
  @ApiUnauthorizedResponse()
  async me(@Req() req: Request): Promise<{ userId: string }> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();
    return { userId: session.userId };
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
  @ApiResponse({ status: 302, description: 'Redirect to dashboard or error' })
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const loginFailedUrl = `${this.frontend.publicAppUrl}/auth/login-failed`;

    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const savedState = cookies[OAUTH_STATE_COOKIE];

    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });

    if (!code || !state || !savedState || state !== savedState) {
      res.redirect(302, loginFailedUrl);
      return;
    }

    try {
      const event = await this.googleAdapter.exchangeCode(code);
      const { userId } = await this.identity.resolveOrCreate(event);
      const { sid, expiresAt } = await this.sessions.issue(userId, 'google');
      res.cookie(this.session.cookieName, sid, this.cookieOptions(expiresAt));
      res.redirect(
        302,
        `${this.frontend.publicAppUrl}${this.session.postLoginPath}`,
      );
    } catch {
      res.redirect(302, loginFailedUrl);
    }
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
