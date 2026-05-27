// Must be the first import: Nest's @Injectable() decorators require the
// reflect-metadata polyfill to be installed before any decorated class loads.
// `nest start` injects this automatically; standalone runners (ts-node, tsx)
// don't.
import 'reflect-metadata';

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from '../src/app.module';
import { buildOpenApiDocumentBuilder } from '../src/openapi/document-builder';

async function dump(): Promise<void> {
  // `app.init()` (called by NestFactory.create then awaited via close) wires
  // up modules without binding an HTTP listener — we don't call `listen()`,
  // so the configured port stays free for the actual server process.
  const app = await NestFactory.create(AppModule, {
    logger: ['warn', 'error'],
  });

  const document = SwaggerModule.createDocument(
    app,
    buildOpenApiDocumentBuilder().build(),
  );

  const outPath = resolve(__dirname, '..', '..', 'shared', 'openapi.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(document, null, 2) + '\n', 'utf8');

  // Best-effort cleanup. nestjs-telegraf throws from its shutdown hook because
  // we never started polling, and BullMQ keeps event loop handles alive — none
  // of which matters once the JSON is on disk. Swallow + force-exit so callers
  // (npm scripts, CI) see exit code 0 on success.
  try {
    await app.close();
  } catch {
    // ignore: shutdown noise from sub-modules that weren't fully started
  }
  process.exit(0);
}

dump().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
