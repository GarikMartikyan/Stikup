import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { googleOAuthConfig } from '../../config/google-oauth.config';
import type { ChannelEvent } from './channel-event';

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

@Injectable()
export class GoogleAdapter {
  constructor(
    @Inject(googleOAuthConfig.KEY)
    private readonly config: ConfigType<typeof googleOAuthConfig>,
  ) {}

  buildAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<ChannelEvent> {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenRes.ok) {
      throw new UnauthorizedException('Google token exchange failed');
    }

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

    const userRes = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    if (!userRes.ok) {
      throw new UnauthorizedException('Failed to fetch Google user info');
    }

    const userInfo = (await userRes.json()) as GoogleUserInfo;

    return {
      channel: 'google',
      channelUserId: userInfo.sub,
      profile: {
        displayName: userInfo.name,
        username: userInfo.email,
        avatarUrl: userInfo.picture,
      },
    };
  }
}
