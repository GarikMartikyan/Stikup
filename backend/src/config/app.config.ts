import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsPositive, validateSync } from 'class-validator';

export class AppConfigSchema {
  @IsInt()
  @IsPositive()
  port!: number;

  @IsIn(['development', 'production', 'test'])
  nodeEnv!: 'development' | 'production' | 'test';
}

function toInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const appConfig = registerAs('app', (): AppConfigSchema => {
  const raw = {
    port: toInt(process.env.PORT, 3131),
    nodeEnv: (process.env.NODE_ENV ?? 'development') as
      | 'development'
      | 'production'
      | 'test',
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
