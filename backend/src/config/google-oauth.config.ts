import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';

import { getEnvProfile, isPlaceholder } from './environment';

export class GoogleOAuthConfigSchema {
  @IsString()
  clientId!: string;

  @IsString()
  clientSecret!: string;

  @IsString()
  redirectUri!: string;
}

export const googleOAuthConfig = registerAs(
  'googleOAuth',
  (): GoogleOAuthConfigSchema => {
    const raw = {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI ?? '',
    };

    const instance = plainToInstance(GoogleOAuthConfigSchema, raw);
    const errors = validateSync(instance, { whitelist: true });
    if (errors.length) {
      throw new Error(
        'Invalid GOOGLE_OAUTH config:\n' +
          errors.map((e) => e.toString()).join('\n'),
      );
    }

    const profile = getEnvProfile();
    if (profile.strictSecrets) {
      if (
        isPlaceholder(instance.clientId) ||
        isPlaceholder(instance.clientSecret) ||
        isPlaceholder(instance.redirectUri)
      ) {
        throw new Error(
          'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI must be set to real values in production.',
        );
      }
      if (!instance.redirectUri.startsWith('https://')) {
        throw new Error('GOOGLE_REDIRECT_URI must use https:// in production.');
      }
    }

    return instance;
  },
);
