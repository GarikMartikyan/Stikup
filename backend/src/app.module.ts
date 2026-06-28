import * as path from 'node:path';

import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';

import { HttpOnlyThrottlerGuard } from './common/guards/http-only-throttler.guard';
import { TelegrafModule } from 'nestjs-telegraf';

import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppConfigModule } from './config/app-config.module';
import { telegramConfig } from './config/telegram.config';
import { HealthModule } from './health/health.module';
import { ImageProcessingModule } from './image-processing/image-processing.module';
import { JobsModule } from './jobs/jobs.module';
import { PackModule } from './pack/pack.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { ReferralModule } from './referral/referral.module';
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
        // launchOptions: false skips bot.launch() (the getUpdates polling
        // loop) entirely. The injected Telegraf client still sends stickers
        // and messages — we only avoid the 409 Conflict that would crash a
        // local instance while the production bot owns the token.
        // When we DO poll, dropPendingUpdates discards the backlog accumulated
        // while the container was down (e.g. across a deploy), so a restart
        // doesn't reprocess stale updates or fight a just-stopped poller.
        ...(tg.launchBot
          ? { launchOptions: { dropPendingUpdates: true } }
          : { launchOptions: false as const }),
      }),
    }),
    ImageProcessingModule,
    QueueModule,
    TelegramModule,
    PackModule,
    ReferralModule,
    JobsModule,
    HealthModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: HttpOnlyThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
