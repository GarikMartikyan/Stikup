/**
 * Smoke test for the REAL OpenAI image-generation path.
 *
 * Drives the production `OpenAIImageProvider` + the production
 * `split_stickers.py` against a real photo, WITHOUT needing Redis/Postgres or
 * the Nest app. Saves the raw 3x4 sheet (for eyeballing) and reports how many
 * stickers the splitter produced.
 *
 *   # put OPENAI_API_KEY in the repo-root .env.development.local first, then:
 *   npm run -w backend smoke:openai -- --image /path/to/face-photo.jpg
 *
 * Optional: --out <dir> (default ./openai-smoke-out).
 */
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { openaiConfig } from '../src/config/openai.config';
import { OpenAIImageProvider } from '../src/image-processing/openai-image-provider';
import { STICKER_PROMPT } from '../src/image-processing/sticker-prompt';

const execFileAsync = promisify(execFile);

function parseArgs(): { image: string; out: string } {
  const argv = process.argv.slice(2);
  let image = '';
  let out = 'openai-smoke-out';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--image') image = argv[++i] ?? '';
    else if (argv[i] === '--out') out = argv[++i] ?? out;
  }
  return { image, out };
}

async function main(): Promise<void> {
  const { image, out } = parseArgs();
  if (!image) {
    console.error(
      'Usage: npm run -w backend smoke:openai -- --image <path-to-photo> [--out <dir>]',
    );
    process.exit(2);
  }

  const config = openaiConfig();
  if (
    !config.apiKey ||
    config.apiKey.trim() === '' ||
    config.apiKey === 'changeme'
  ) {
    console.error(
      'OPENAI_API_KEY is not set. Add it to the repo-root .env.development.local and retry.',
    );
    process.exit(2);
  }

  console.log(
    `provider=openai model=${config.model} size=${config.size} ` +
      `quality=${config.quality} inputFidelity=${config.inputFidelity}`,
  );

  const source = await readFile(resolve(image));
  console.log(`source image: ${image} (${source.length} bytes)`);

  const outDir = resolve(out);
  await mkdir(outDir, { recursive: true });

  console.log('\ncalling OpenAI images.edit — this typically takes 30-90s ...');
  const t0 = Date.now();
  let sheet: Buffer;
  try {
    const provider = new OpenAIImageProvider(config);
    sheet = await provider.generate(source, STICKER_PROMPT);
  } catch (err) {
    console.error(
      '\n❌ GENERATION FAILED:',
      err instanceof Error ? err.message : String(err),
    );
    console.error('\nMost common causes:');
    console.error(
      '  • 403 "must be verified": your OpenAI organization is not verified for gpt-image-1',
    );
    console.error(
      '      → https://platform.openai.com/settings/organization/general → Verify Organization',
    );
    console.error('  • 401: invalid or expired API key');
    console.error(
      '  • 400 "model"/access: the key/project has no access to gpt-image-1',
    );
    console.error(
      '  • moderation: the uploaded photo was rejected by safety filters',
    );
    process.exit(1);
  }
  const genMs = Date.now() - t0;

  const sheetPath = join(outDir, 'sheet.png');
  await writeFile(sheetPath, sheet);
  console.log(
    `\n✅ sheet received in ${(genMs / 1000).toFixed(1)}s → ${sheetPath} (${sheet.length} bytes)`,
  );

  // Run the SAME splitter the production worker runs.
  const splitter = resolve(__dirname, '..', 'python', 'split_stickers.py');
  const stickersDir = join(outDir, 'stickers');
  await mkdir(stickersDir, { recursive: true });
  console.log('\nsplitting sheet with split_stickers.py ...');
  try {
    const { stderr } = await execFileAsync('python3', [
      splitter,
      sheetPath,
      '-o',
      stickersDir,
      '--grid',
    ]);
    if (stderr.trim()) console.log('splitter stderr:', stderr.trim());
  } catch (err) {
    console.error(
      '\n❌ SPLITTER FAILED:',
      err instanceof Error ? err.message : String(err),
    );
    console.error(
      '   Ensure python deps are installed: pip3 install -r backend/python/requirements.txt',
    );
    process.exit(1);
  }

  const files = (await readdir(stickersDir))
    .filter((f) => f.endsWith('.webp'))
    .sort();
  console.log(`\nstickers produced: ${files.length}`);
  files.forEach((f) => console.log('  ' + join(stickersDir, f)));

  if (files.length === 12) {
    console.log(
      `\n🎉 PASS — exactly 12 stickers. Open ${sheetPath} and the stickers/ dir to confirm quality (clean 3x4 green grid, recognizable chibi).`,
    );
  } else {
    console.log(
      `\n⚠️  WARN — expected 12 stickers, got ${files.length}. The model likely did not produce a clean, well-separated 3x4 green grid.`,
    );
    console.log(
      `   Inspect ${sheetPath}. In production the worker treats <12 as a failure (pack → failed, generation refunded).`,
    );
    process.exit(3);
  }
}

void main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
