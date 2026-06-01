import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getPackStickerFiles } from '../sticker-assets';

describe('getPackStickerFiles', () => {
  let stickerDir: string;
  const packId = 'pack-real-uuid';

  beforeAll(async () => {
    stickerDir = await mkdtemp(join(tmpdir(), 'stikup-assets-'));
    const packDir = join(stickerDir, packId);
    await mkdir(packDir, { recursive: true });
    // Lay down a dense range of real sticker files: sticker_1..3.webp.
    for (let i = 1; i <= 3; i++) {
      await writeFile(join(packDir, `sticker_${i}.webp`), Buffer.from('x'));
    }
  });

  afterAll(async () => {
    await rm(stickerDir, { recursive: true, force: true });
  });

  it('returns a dense, ordered list of the pack’s real sticker paths', () => {
    expect(getPackStickerFiles(stickerDir, packId, 3)).toEqual([
      join(stickerDir, packId, 'sticker_1.webp'),
      join(stickerDir, packId, 'sticker_2.webp'),
      join(stickerDir, packId, 'sticker_3.webp'),
    ]);
  });

  it('returns a subset (sticker_1..N) when fewer than all stickers are requested', () => {
    expect(getPackStickerFiles(stickerDir, packId, 2)).toEqual([
      join(stickerDir, packId, 'sticker_1.webp'),
      join(stickerDir, packId, 'sticker_2.webp'),
    ]);
  });

  it('returns an empty array when any file in the range is missing (no sparse list)', () => {
    // Only sticker_1..3 exist; requesting 4 must yield [] so ensureSet never
    // consumes a sparse/positionally-wrong list.
    expect(getPackStickerFiles(stickerDir, packId, 4)).toEqual([]);
  });

  it('returns an empty array for an unknown pack', () => {
    expect(getPackStickerFiles(stickerDir, 'no-such-pack', 1)).toEqual([]);
  });
});
