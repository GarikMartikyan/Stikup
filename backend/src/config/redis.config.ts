import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, validateSync } from 'class-validator';

export class RedisConfigSchema {
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    require_tld: false,
    require_protocol: true,
    protocols: ['redis', 'rediss'],
  })
  url!: string;
}

export const redisConfig = registerAs('redis', (): RedisConfigSchema => {
  const raw = {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  };

  const instance = plainToInstance(RedisConfigSchema, raw);
  const errors = validateSync(instance, { whitelist: true });
  if (errors.length) {
    throw new Error(
      'Invalid REDIS config:\n' + errors.map((e) => e.toString()).join('\n'),
    );
  }
  return instance;
});
