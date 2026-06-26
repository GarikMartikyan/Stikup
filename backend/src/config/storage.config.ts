import { join } from 'node:path';

import { registerAs } from '@nestjs/config';

export interface StorageConfig {
  stickerDir: string;
}

export const storageConfig = registerAs(
  'storage',
  (): StorageConfig => ({
    // Default resolves relative to the compiled module directory.
    stickerDir:
      process.env.STICKER_STORAGE_DIR ??
      join(__dirname, '..', '..', 'public', 'packs'),
  }),
);
