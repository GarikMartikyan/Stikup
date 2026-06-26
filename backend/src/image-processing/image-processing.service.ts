import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { Injectable, Logger } from '@nestjs/common';

const execFileAsync = promisify(execFile);

const PYTHON_BIN = 'python3';
const PYTHON_SCRIPT = join(
  __dirname,
  '..',
  '..',
  'python',
  'split_stickers.py',
);
// Kill the subprocess if it hasn't finished within 2 minutes.
const SUBPROCESS_TIMEOUT = 120_000;

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  /**
   * Split a pre-rendered 4×3 sticker-grid image into 12 individual WebP
   * stickers. The caller is responsible for invoking `cleanup()` once it has
   * finished reading the returned sticker files.
   */
  async generateStickers(
    sourceImage: Buffer,
  ): Promise<{ stickerPaths: string[]; cleanup: () => Promise<void> }> {
    const jobId = randomUUID();
    const inputPath = join(tmpdir(), `sticker_${jobId}_input.png`);
    const outputDir = join(tmpdir(), `stickers_${jobId}`);

    await writeFile(inputPath, sourceImage);
    await mkdir(outputDir, { recursive: true });

    try {
      // --grid: deterministic 4×3 geometric tiling so the split is reliable
      // even when adjacent sticker outlines touch (content-based detection
      // would fail in that case).
      const { stderr } = await execFileAsync(
        PYTHON_BIN,
        [PYTHON_SCRIPT, inputPath, '-o', outputDir, '--grid'],
        { timeout: SUBPROCESS_TIMEOUT },
      );
      if (stderr) {
        this.logger.warn(`python stderr: ${stderr}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`python image processing failed: ${message}`);
    }

    const entries = await readdir(outputDir);
    const stickerPaths = entries
      .filter((name) => name.endsWith('.webp'))
      .sort()
      .map((name) => join(outputDir, name));

    this.logger.log(
      `sticker pack ready: ${stickerPaths.length} files in ${outputDir}`,
    );

    // Caller owns cleanup — the returned sticker paths are read after this
    // function resolves, so deleting them here would race the consumer.
    const cleanup = async (): Promise<void> => {
      try {
        await rm(outputDir, { recursive: true, force: true });
      } catch (err) {
        this.logger.debug(
          `failed to remove outputDir ${outputDir}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      try {
        await rm(inputPath, { force: true });
      } catch (err) {
        this.logger.debug(
          `failed to remove inputPath ${inputPath}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    };

    return { stickerPaths, cleanup };
  }
}
