import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfig } from './app.config';
import { frontendConfig } from './frontend.config';
import { sessionConfig } from './session.config';
import { telegramConfig } from './telegram.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
      load: [appConfig, telegramConfig, frontendConfig, sessionConfig],
    }),
  ],
})
export class AppConfigModule {}
