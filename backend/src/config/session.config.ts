import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

export class SessionConfigSchema {
  @IsString()
  @IsNotEmpty()
  cookieName!: string;

  @IsOptional()
  @IsString()
  cookieDomain?: string;

  @IsBoolean()
  cookieSecure!: boolean;

  @IsString()
  @IsNotEmpty()
  postLoginPath!: string;
}

function toBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw.toLowerCase() === 'true';
}

export const sessionConfig = registerAs('session', (): SessionConfigSchema => {
  const raw = {
    cookieName: process.env.SESSION_COOKIE_NAME || 'sid',
    cookieDomain: process.env.SESSION_COOKIE_DOMAIN || undefined,
    cookieSecure: toBool(process.env.SESSION_COOKIE_SECURE, false),
    postLoginPath: process.env.POST_LOGIN_PATH || '/my-stickers',
  };

  const instance = plainToInstance(SessionConfigSchema, raw);
  const errors = validateSync(instance, { whitelist: true });
  if (errors.length) {
    throw new Error(
      'Invalid SESSION config:\n' + errors.map((e) => e.toString()).join('\n'),
    );
  }
  return instance;
});
