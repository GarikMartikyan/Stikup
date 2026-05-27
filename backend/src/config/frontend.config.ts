import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  validateSync,
} from 'class-validator';

export class FrontendConfigSchema {
  @IsOptional()
  @IsString()
  host?: string;

  @IsInt()
  @IsPositive()
  port!: number;

  @IsBoolean()
  useHttps!: boolean;

  @IsOptional()
  @IsString()
  url?: string;

  @IsString()
  publicAppUrl!: string;
}

function toInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw.toLowerCase() === 'true';
}

export const frontendConfig = registerAs(
  'frontend',
  (): FrontendConfigSchema => {
    const host = process.env.FRONTEND_HOST || undefined;
    const port = toInt(process.env.FRONTEND_PORT, 3000);
    const useHttps = toBool(process.env.FRONTEND_USE_HTTPS, false);
    const url = process.env.FRONTEND_URL || undefined;

    const explicitPublic = process.env.PUBLIC_APP_URL;
    let publicAppUrl: string;
    if (explicitPublic) {
      publicAppUrl = explicitPublic.replace(/\/$/, '');
    } else if (url) {
      publicAppUrl = url.replace(/\/$/, '');
    } else {
      const scheme = useHttps ? 'https' : 'http';
      const resolvedHost = host ?? 'localhost';
      publicAppUrl = `${scheme}://${resolvedHost}:${port}`;
    }

    const raw = { host, port, useHttps, url, publicAppUrl };

    const instance = plainToInstance(FrontendConfigSchema, raw);
    const errors = validateSync(instance, { whitelist: true });
    if (errors.length) {
      throw new Error(
        'Invalid FRONTEND config:\n' +
          errors.map((e) => e.toString()).join('\n'),
      );
    }
    return instance;
  },
);
