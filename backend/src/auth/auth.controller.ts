import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';

import { AppConfigService } from '../config/app-config.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly config: AppConfigService,
  ) {}

  @Get('exchange')
  async exchange(
    @Query('t') token: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const loginUrl = `${this.config.publicAppUrl}/auth/login-failed`;

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

    res.cookie(this.config.sessionCookieName, sid, this.cookieOptions(expiresAt));
    res.redirect(302, `${this.config.publicAppUrl}${this.config.postLoginPath}`);
  }

  @Get('me')
  async me(@Req() req: Request): Promise<{ userId: string }> {
    const sid = req.cookies?.[this.config.sessionCookieName];
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();
    return { userId: session.userId };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const sid = req.cookies?.[this.config.sessionCookieName];
    if (sid) await this.sessions.revoke(sid);
    res.clearCookie(this.config.sessionCookieName, this.cookieOptions(new Date(0)));
    res.status(204).send();
  }

  private cookieOptions(expires: Date): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.sessionCookieSecure,
      sameSite: 'lax',
      expires,
      path: '/',
      domain: this.config.sessionCookieDomain,
    };
  }
}
