import { join } from 'node:path';

import { registerAs } from '@nestjs/config';

export interface StorageConfig {
  stickerDir: string;
}

export const storageConfig = registerAs(
  'storage',
  (): StorageConfig => ({
    // Default resolves relative to the compiled module directory, mirroring the
    // pattern used by StubAiImageProvider for its static assets.
    stickerDir:
      process.env.STICKER_STORAGE_DIR ??
      join(__dirname, '..', '..', 'public', 'packs'),
  }),
);
