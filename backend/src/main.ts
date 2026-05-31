import { Logger, ValidationPipe } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Application } from 'express';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { appConfig } from './config/app.config';
import { getEnvProfile } from './config/environment';
import { frontendConfig } from './config/frontend.config';
import { storageConfig } from './config/storage.config';
import { buildOpenApiDocumentBuilder } from './openapi/document-builder';

async function bootstrap(): Promise<void> {
  const profile = getEnvProfile();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust the first proxy hop so Secure cookies and real client IPs work behind Caddy.
  (app.getHttpAdapter().getInstance() as Application).set('trust proxy', 1);

  app.use(cookieParser());

  const frontendCfg = app.get<ConfigType<typeof frontendConfig>>(
    frontendConfig.KEY,
  );
  const origins = Array.from(
    new Set([
      frontendCfg.publicAppUrl,
      `http://localhost:${frontendCfg.port}`,
      `http://127.0.0.1:${frontendCfg.port}`,
    ]),
  );
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serve generated sticker packs. Next.js rewrites /api/:path* → backend /:path*,
  // so the browser URL /api/static/packs/... maps to /static/packs/... here.
  const storageCfg = app.get<ConfigType<typeof storageConfig>>(
    storageConfig.KEY,
  );
  app.useStaticAssets(storageCfg.stickerDir, { prefix: '/static/packs' });

  if (profile.swaggerEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      buildOpenApiDocumentBuilder().build(),
    );
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const cfg = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  await app.listen(cfg.port);
  Logger.log(`Environment: ${profile.appEnv}`, 'Bootstrap');
  Logger.log(`Server running on port: ${cfg.port}`, 'Bootstrap');
}
void bootstrap();
