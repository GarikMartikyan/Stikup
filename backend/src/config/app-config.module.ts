import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { aiConfig } from './ai.config';
import { appConfig } from './app.config';
import { ConfigController } from './config.controller';
import { resolveAppEnv } from './environment';
import { frontendConfig } from './frontend.config';
import { googleOAuthConfig } from './google-oauth.config';
import { offerConfig } from './offer.config';
import { redisConfig } from './redis.config';
import { sessionConfig } from './session.config';
import { telegramConfig } from './telegram.config';

const env = resolveAppEnv();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Most-specific first; @nestjs/config uses first-file-wins semantics.
      envFilePath: [
        `../.env.${env}.local`,
        `../.env.${env}`,
        '../.env.local',
        '../.env',
        `.env.${env}.local`,
        `.env.${env}`,
        '.env.local',
        '.env',
      ],
      load: [
        appConfig,
        telegramConfig,
        frontendConfig,
        sessionConfig,
        aiConfig,
        redisConfig,
        googleOAuthConfig,
        offerConfig,
      ],
    }),
  ],
  controllers: [ConfigController],
})
export class AppConfigModule {}
