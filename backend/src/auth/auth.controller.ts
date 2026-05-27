import {
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';

import { frontendConfig } from '../config/frontend.config';
import { sessionConfig } from '../config/session.config';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    @Inject(frontendConfig.KEY)
    private readonly frontend: ConfigType<typeof frontendConfig>,
    @Inject(sessionConfig.KEY)
    private readonly session: ConfigType<typeof sessionConfig>,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get('exchange')
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
  async me(@Req() req: Request): Promise<{ userId: string }> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();
    return { userId: session.userId };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const sid = cookies[this.session.cookieName];
    if (sid) await this.sessions.revoke(sid);
    res.clearCookie(this.session.cookieName, this.cookieOptions(new Date(0)));
    res.status(204).send();
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
