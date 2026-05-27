import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TelegrafModule } from 'nestjs-telegraf';

import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/app-config.module';
import { telegramConfig } from './config/telegram.config';
import { HealthModule } from './health/health.module';
import { ImageProcessingModule } from './image-processing/image-processing.module';
import { JobsModule } from './jobs/jobs.module';
import { PackModule } from './pack/pack.module';
import { PrismaModule } from './prisma/prisma.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    TelegrafModule.forRootAsync({
      inject: [telegramConfig.KEY],
      useFactory: (tg: ConfigType<typeof telegramConfig>) => ({
        token: tg.botToken,
      }),
    }),
    ImageProcessingModule,
    TelegramModule,
    PackModule,
    JobsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
