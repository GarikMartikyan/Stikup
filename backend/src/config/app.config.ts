import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsPositive, validateSync } from 'class-validator';

import { type AppEnv, resolveAppEnv } from './environment';

export class AppConfigSchema {
  @IsInt()
  @IsPositive()
  port!: number;

  @IsIn(['development', 'production', 'test'])
  nodeEnv!: 'development' | 'production' | 'test';

  @IsIn(['development', 'production', 'test'])
  appEnv!: AppEnv;
}

function toInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const appConfig = registerAs('app', (): AppConfigSchema => {
  const raw = {
    port: toInt(process.env.PORT, 3131),
    nodeEnv: (process.env.NODE_ENV ?? 'development') as AppEnv,
    appEnv: resolveAppEnv(),
  };

  const instance = plainToInstance(AppConfigSchema, raw);
  const errors = validateSync(instance, { whitelist: true });
  if (errors.length) {
    throw new Error(
      'Invalid APP config:\n' + errors.map((e) => e.toString()).join('\n'),
    );
  }
  return instance;
});
