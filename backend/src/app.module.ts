import * as path from 'node:path';

import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';

import { HttpOnlyThrottlerGuard } from './common/guards/http-only-throttler.guard';
import { TelegrafModule } from 'nestjs-telegraf';

import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/app-config.module';
import { telegramConfig } from './config/telegram.config';
import { HealthModule } from './health/health.module';
import { ImageProcessingModule } from './image-processing/image-processing.module';
import { JobsModule } from './jobs/jobs.module';
import { PackModule } from './pack/pack.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, 'i18n'),
        watch: false,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    TelegrafModule.forRootAsync({
      inject: [telegramConfig.KEY],
      useFactory: (tg: ConfigType<typeof telegramConfig>) => ({
        token: tg.botToken,
      }),
    }),
    ImageProcessingModule,
    QueueModule,
    TelegramModule,
    PackModule,
    JobsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: HttpOnlyThrottlerGuard }],
})
export class AppModule {}
