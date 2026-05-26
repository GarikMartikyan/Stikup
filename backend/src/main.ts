import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const port = app.get(AppConfigService).port;
  await app.listen(port);
  Logger.log(`Server running on port: ${port}`, 'Bootstrap');
}
bootstrap();
