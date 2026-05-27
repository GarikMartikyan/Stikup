import { Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { appConfig } from './config/app.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const cfg = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  await app.listen(cfg.port);
  Logger.log(`Server running on port: ${cfg.port}`, 'Bootstrap');
}
void bootstrap();
