import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

export class GoogleOAuthConfigSchema {
  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  clientSecret!: string;

  @IsString()
  @IsNotEmpty()
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
    return instance;
  },
);
