import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { Logger } from '@nestjs/common';

const PLACEHOLDER_DIR = join(
  __dirname,
  '..',
  '..',
  'public',
  'sticker-placeholders',
);

const logger = new Logger('stickerAssets');

/**
 * Return local file paths for placeholder stickers 1..count.
 * If any file in the range is missing the entire list is considered unavailable:
 * an empty array is returned and the caller must treat it as "no files available".
 * This prevents a sparse/compacted list from being consumed positionally by
 * ensureSet, which relies on a dense [sticker_1..sticker_N] list.
 */
export function getPlaceholderFiles(count: number): string[] {
  const files: string[] = [];
  for (let i = 1; i <= count; i++) {
    const filePath = join(PLACEHOLDER_DIR, `sticker_${i}.webp`);
    if (!existsSync(filePath)) {
      logger.warn(
        `placeholder file missing: ${filePath}; treating set as unavailable`,
      );
      return [];
    }
    files.push(filePath);
  }
  return files;
}
