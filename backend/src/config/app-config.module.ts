import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { aiConfig } from './ai.config';
import { appConfig } from './app.config';
import { ConfigController } from './config.controller';
import { frontendConfig } from './frontend.config';
import { googleOAuthConfig } from './google-oauth.config';
import { offerConfig } from './offer.config';
import { redisConfig } from './redis.config';
import { sessionConfig } from './session.config';
import { telegramConfig } from './telegram.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
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
