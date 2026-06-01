import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { Logger } from '@nestjs/common';

const logger = new Logger('stickerAssets');

/**
 * Return local file paths for a pack's real generated stickers, `sticker_1..count`,
 * located under `<stickerDir>/<packId>/`.
 *
 * If any file in the range is missing the entire list is considered unavailable:
 * an empty array is returned and the caller must treat it as "no files
 * available". ensureSet consumes the list positionally and relies on a dense
 * `[sticker_1..sticker_N]` range, so a sparse list must never be returned.
 */
export function getPackStickerFiles(
  stickerDir: string,
  packId: string,
  count: number,
): string[] {
  const packDir = join(stickerDir, packId);
  const files: string[] = [];
  for (let i = 1; i <= count; i++) {
    const filePath = join(packDir, `sticker_${i}.webp`);
    if (!existsSync(filePath)) {
      logger.warn(
        `pack sticker missing: ${filePath}; treating set as unavailable`,
      );
      return [];
    }
    files.push(filePath);
  }
  return files;
}
