# Telegram Interstitial Ads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monetize Stikup by playing an Adsgram interstitial video during sticker generation inside the Telegram Mini App, and funnel web users into Telegram.

**Architecture:** Frontend-only. A thin, SSR-safe wrapper (`lib/ads/adsgram.ts`) hides the Adsgram SDK and always resolves to a tagged result so it never breaks generation. On `/upload`, the ad and `POST /api/packs` run in parallel; navigation to the result waits for both. Outside Telegram, generation is replaced by an "Open in Telegram" CTA. No backend changes.

**Tech Stack:** Next.js 16 / React 19 (client components), Adsgram Mini-App SDK, Vitest + @testing-library/react (jsdom), next-intl messages.

## Global Constraints

- **This is Next.js 16 / React 19** — read `node_modules/next/dist/docs/` before writing frontend code if anything is unclear (per `frontend/AGENTS.md`). Changes here are client components; no Server Component / Server Action APIs are involved.
- **Env vars come from the repo-root `.env`** via the workspace npm scripts. Never create `frontend/.env`.
- **Block ID:** `NEXT_PUBLIC_ADSGRAM_BLOCK_ID=int-36357` (interstitial format, `int-` prefix). Empty/unset ⇒ ads disabled, app behaves exactly as today.
- **Ad is best-effort:** `showInterstitial()` MUST NEVER throw and MUST NEVER block delivery of an already-generated pack.
- **Tests:** Vitest, jsdom. Run from `frontend/`: `npx vitest run <file>`. All tests pass before each commit.
- **Commit after each task** with a `feat:` / `test:` message.
- Mirror existing patterns: `lib/telegram/webapp.ts` for the wrapper, `lib/telegram/__tests__/webapp.test.ts` for tests, `lib/config.ts` for env access.

---

### Task 1: Adsgram wrapper + config getter

**Files:**

- Create: `frontend/src/lib/ads/adsgram.ts`
- Modify: `frontend/src/lib/config.ts` (append a getter)
- Test: `frontend/src/lib/ads/__tests__/adsgram.test.ts`

**Interfaces:**

- Consumes: `isTelegramEnv()` from `@/lib/telegram/webapp`.
- Produces:
  - `adsgramBlockId(): string` (in `@/lib/config`)
  - `type AdResult = "shown" | "skipped" | "error"` (in `@/lib/ads/adsgram`)
  - `showInterstitial(): Promise<AdResult>` (in `@/lib/ads/adsgram`)

- [ ] **Step 1: Add the config getter**

In `frontend/src/lib/config.ts`, append:

```ts
/**
 * Adsgram interstitial block id (e.g. "int-36357"). NEXT_PUBLIC so the browser
 * can read it. Exposed as a function (not a top-level const) so it can be
 * stubbed in tests with `vi.stubEnv` while Next still inlines the static
 * `process.env.NEXT_PUBLIC_*` expression at build time. Empty string disables ads.
 */
export function adsgramBlockId(): string {
  return process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID ?? '';
}
```

- [ ] **Step 2: Write the failing test**

Create `frontend/src/lib/ads/__tests__/adsgram.test.ts`:

```ts
import { describe, it, expect, afterEach, vi } from 'vitest';
import { showInterstitial } from '../adsgram';

function setTelegram(on: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Telegram = on ? { WebApp: { initData: 'x' } } : undefined;
}

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).Telegram;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).Adsgram;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('showInterstitial', () => {
  it("returns 'skipped' when not in Telegram", async () => {
    setTelegram(false);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    expect(await showInterstitial()).toBe('skipped');
  });

  it("returns 'skipped' when the SDK is absent", async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    expect(await showInterstitial()).toBe('skipped');
  });

  it("returns 'skipped' when no block id is configured", async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', '');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = {
      init: () => ({ show: () => Promise.resolve() }),
    };
    expect(await showInterstitial()).toBe('skipped');
  });

  it("returns 'shown' when the ad resolves", async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    const show = vi.fn(() => Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = { init: vi.fn(() => ({ show })) };
    expect(await showInterstitial()).toBe('shown');
    expect(show).toHaveBeenCalledOnce();
  });

  it("returns 'error' when the ad rejects", async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = {
      init: () => ({ show: () => Promise.reject(new Error('no fill')) }),
    };
    expect(await showInterstitial()).toBe('error');
  });

  it('passes the configured block id to init', async () => {
    setTelegram(true);
    vi.stubEnv('NEXT_PUBLIC_ADSGRAM_BLOCK_ID', 'int-36357');
    const init = vi.fn(() => ({ show: () => Promise.resolve() }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Adsgram = { init };
    await showInterstitial();
    expect(init).toHaveBeenCalledWith({ blockId: 'int-36357' });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/ads/__tests__/adsgram.test.ts`
Expected: FAIL — cannot resolve `../adsgram`.

- [ ] **Step 4: Implement the wrapper**

Create `frontend/src/lib/ads/adsgram.ts`:

```ts
/**
 * Minimal, SSR-safe wrapper around the Adsgram Mini-App SDK.
 *
 * The SDK is loaded via a <Script> tag in layout.tsx and attaches itself to
 * `window.Adsgram`. This file only reads that global. `showInterstitial` is
 * best-effort: it always resolves to a tagged result and never rejects, so
 * callers can run it alongside real work without try/catch.
 */
import { isTelegramEnv } from '@/lib/telegram/webapp';
import { adsgramBlockId } from '@/lib/config';

/** Outcome of an interstitial attempt. */
export type AdResult = 'shown' | 'skipped' | 'error';

interface AdController {
  show(): Promise<unknown>;
}

interface AdsgramSDK {
  init(params: { blockId: string }): AdController;
}

declare global {
  interface Window {
    Adsgram?: AdsgramSDK;
  }
}

/**
 * Show an Adsgram interstitial.
 *
 * - "skipped": outside Telegram, SDK not loaded, or no block id configured.
 * - "shown": the ad played and closed.
 * - "error": the SDK rejected (no fill, network, closed early, etc.).
 */
export async function showInterstitial(): Promise<AdResult> {
  if (!isTelegramEnv()) return 'skipped';
  if (typeof window === 'undefined') return 'skipped';

  const sdk = window.Adsgram;
  const blockId = adsgramBlockId();
  if (!sdk || !blockId) return 'skipped';

  try {
    const controller = sdk.init({ blockId });
    await controller.show();
    return 'shown';
  } catch {
    return 'error';
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/ads/__tests__/adsgram.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/ads/adsgram.ts frontend/src/lib/ads/__tests__/adsgram.test.ts frontend/src/lib/config.ts
git commit -m "feat(ads): add SSR-safe Adsgram interstitial wrapper"
```

---

### Task 2: "Open in Telegram" CTA component + i18n

**Files:**

- Create: `frontend/src/components/upload/open-in-telegram.tsx`
- Modify: `frontend/src/i18n/messages/en.json`, `frontend/src/i18n/messages/ru.json`
- Test: `frontend/src/components/upload/__tests__/open-in-telegram.test.tsx`

**Interfaces:**

- Consumes: `TELEGRAM_BOT_URL` from `@/lib/config`, `useT` from `@/components/language-provider`.
- Produces: `OpenInTelegram` (named export) — renders a link to `${TELEGRAM_BOT_URL}?startapp`.

- [ ] **Step 1: Add i18n strings**

In `frontend/src/i18n/messages/en.json`, inside the `"upload"` object (e.g. after the `"error"` block), add:

```json
"telegram_gate": {
  "title": "Sticker creation runs inside Telegram. Open Stikup in Telegram to generate your pack.",
  "button": "Open in Telegram"
}
```

In `frontend/src/i18n/messages/ru.json`, inside the `"upload"` object, add:

```json
"telegram_gate": {
  "title": "Создание стикеров работает внутри Telegram. Откройте Stikup в Telegram, чтобы собрать свой пак.",
  "button": "Открыть в Telegram"
}
```

- [ ] **Step 2: Write the failing test**

Create `frontend/src/components/upload/__tests__/open-in-telegram.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OpenInTelegram } from '../open-in-telegram';

vi.mock('@/components/language-provider', () => ({
  useT: () => (k: string) => k,
}));

describe('OpenInTelegram', () => {
  it("links to the bot's Mini App with ?startapp", () => {
    render(<OpenInTelegram />);
    const link = screen.getByRole('link', { name: /telegram_gate\.button/ });
    expect(link).toHaveAttribute('href', expect.stringContaining('?startapp'));
    expect(link).toHaveAttribute('href', expect.stringContaining('t.me'));
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/components/upload/__tests__/open-in-telegram.test.tsx`
Expected: FAIL — cannot resolve `../open-in-telegram`.

- [ ] **Step 4: Implement the component**

Create `frontend/src/components/upload/open-in-telegram.tsx`:

```tsx
'use client';

import { Send } from 'lucide-react';
import { TELEGRAM_BOT_URL } from '@/lib/config';
import { useT } from '@/components/language-provider';

/**
 * Shown on the web (outside Telegram) when generation is gated. Funnels users
 * into the Telegram Mini App, where the interstitial ad runs.
 */
export function OpenInTelegram() {
  const t = useT();
  return (
    <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 text-center">
      <p className="text-sm font-medium text-[var(--color-fg-muted)]">
        {t('upload.telegram_gate.title')}
      </p>
      <a
        href={`${TELEGRAM_BOT_URL}?startapp`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-7 py-3.5 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
      >
        <Send className="h-5 w-5" /> {t('upload.telegram_gate.button')}
      </a>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd frontend && npx vitest run src/components/upload/__tests__/open-in-telegram.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/upload/open-in-telegram.tsx frontend/src/components/upload/__tests__/open-in-telegram.test.tsx frontend/src/i18n/messages/en.json frontend/src/i18n/messages/ru.json
git commit -m "feat(upload): add Open-in-Telegram CTA + i18n"
```

---

### Task 3: Wire the upload page + load the Adsgram SDK

**Files:**

- Modify: `frontend/src/app/upload/page.tsx`
- Modify: `frontend/src/app/layout.tsx` (add the SDK `<Script>`)
- Test: `frontend/src/app/upload/__tests__/page.test.tsx`

**Interfaces:**

- Consumes: `isTelegramEnv` (`@/lib/telegram/webapp`), `showInterstitial` (`@/lib/ads/adsgram`), `OpenInTelegram` (`@/components/upload/open-in-telegram`).
- Produces: end-to-end behavior — no new exports.

- [ ] **Step 1: Add the Adsgram SDK script to layout**

In `frontend/src/app/layout.tsx`, inside `<head>`, immediately after the existing Telegram SDK `<Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />`, add:

```tsx
<Script
  src="https://sad.adsgram.ai/js/sad.min.js"
  strategy="afterInteractive"
/>
```

- [ ] **Step 2: Write the failing page test**

Create `frontend/src/app/upload/__tests__/page.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadPage from '../page';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Passthrough translator so buttons render their keys verbatim.
vi.mock('@/components/language-provider', () => ({
  useT: () => (k: string) => k,
}));

// Trim heavy presentational children; keep UploadActions real for the button.
vi.mock('@/components/upload/upload-intro', () => ({
  UploadIntro: () => null,
}));
vi.mock('@/components/upload/tips-panel', () => ({ TipsPanel: () => null }));
vi.mock('@/components/upload/drop-zone', () => ({ DropZone: () => null }));
vi.mock('@/components/upload/error-banner', () => ({
  ErrorBanner: ({ message }: { message: string }) => (
    <div role="alert">{message}</div>
  ),
}));

const isTelegramEnvMock = vi.fn();
vi.mock('@/lib/telegram/webapp', () => ({
  isTelegramEnv: () => isTelegramEnvMock(),
}));

const showInterstitialMock = vi.fn();
vi.mock('@/lib/ads/adsgram', () => ({
  showInterstitial: () => showInterstitialMock(),
}));

function selectGrid() {
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const file = new File(['x'], 'grid.png', { type: 'image/png' });
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  // jsdom lacks object-URL support; acceptFile() calls createObjectURL.
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
  pushMock.mockReset();
  isTelegramEnvMock.mockReset();
  showInterstitialMock.mockReset().mockResolvedValue('shown');
});

afterEach(() => {
  vi.restoreAllMocks();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (global as any).fetch;
});

describe('UploadPage submit', () => {
  it('web (non-Telegram): gates generation, shows the Open-in-Telegram CTA, no POST', async () => {
    isTelegramEnvMock.mockReturnValue(false);
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    expect(
      await screen.findByRole('link', { name: /telegram_gate\.button/ }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(showInterstitialMock).not.toHaveBeenCalled();
  });

  it('Telegram: runs ad + generation in parallel, then navigates to the result', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ packId: 'pack-123' }),
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/result/pack-123'),
    );
    expect(showInterstitialMock).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/packs',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('Telegram: still navigates when the ad errors (best-effort)', async () => {
    isTelegramEnvMock.mockReturnValue(true);
    showInterstitialMock.mockResolvedValue('error');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ packId: 'pack-789' }),
    }) as unknown as typeof fetch;

    render(<UploadPage />);
    selectGrid();
    fireEvent.click(
      await screen.findByRole('button', { name: /upload\.actions\.generate/ }),
    );

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith('/result/pack-789'),
    );
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd frontend && npx vitest run src/app/upload/__tests__/page.test.tsx`
Expected: FAIL — current `submit()` calls `fetch` even on web and renders no CTA.

- [ ] **Step 4: Rewrite the upload page**

In `frontend/src/app/upload/page.tsx`:

(a) Add imports near the existing ones:

```tsx
import { isTelegramEnv } from '@/lib/telegram/webapp';
import { showInterstitial } from '@/lib/ads/adsgram';
import { OpenInTelegram } from '@/components/upload/open-in-telegram';
```

(b) Add gated state next to the others:

```tsx
const [gated, setGated] = useState(false);
```

(c) Replace the whole `submit` callback with:

```tsx
const submit = useCallback(async () => {
  if (state.kind !== 'ready') return;
  const file = state.file;

  // Web (outside Telegram): don't generate — funnel the user into Telegram,
  // where the interstitial ad runs.
  if (!isTelegramEnv()) {
    setGated(true);
    return;
  }

  setSubmitting(true);

  const createPack = async (): Promise<string | null> => {
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/packs', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      if (res.status === 401) {
        router.push('/login');
        return null;
      }
      if (res.status === 403) {
        setState({ kind: 'error', message: t('upload.error.no_generations') });
        return null;
      }
      if (!res.ok) {
        setState({
          kind: 'error',
          message: t('upload.error.generation_failed'),
        });
        return null;
      }
      const { packId } = (await res.json()) as { packId: string };
      return packId;
    } catch {
      setState({ kind: 'error', message: t('upload.error.generation_failed') });
      return null;
    }
  };

  // Ad and generation run together; navigate only after both settle.
  // showInterstitial never rejects, so its result is best-effort and ignored.
  const [, packId] = await Promise.all([showInterstitial(), createPack()]);

  if (packId) {
    router.push(`/result/${packId}`);
    return;
  }
  setSubmitting(false);
}, [state, router, t]);
```

(d) In `reset`, also clear the gate — change the body to additionally call `setGated(false)`:

```tsx
const reset = useCallback(() => {
  if (state.kind === 'ready') URL.revokeObjectURL(state.url);
  setState({ kind: 'idle' });
  setGated(false);
  if (galleryRef.current) galleryRef.current.value = '';
}, [state]);
```

(e) Render the CTA right after `<UploadActions ... />` (inside the same `<div className="reveal" ...>`):

```tsx
{
  gated && <OpenInTelegram />;
}
```

- [ ] **Step 5: Run the page test to verify it passes**

Run: `cd frontend && npx vitest run src/app/upload/__tests__/page.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: PASS (all suites, including the new ones).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/upload/page.tsx frontend/src/app/layout.tsx frontend/src/app/upload/__tests__/page.test.tsx
git commit -m "feat(upload): show Adsgram interstitial on generate; gate web to Telegram"
```

---

### Task 4: Configuration, verification & rollout

**Files:**

- Modify: repo-root `.env` (local) and the production droplet `.env`
- No code/test changes.

**Interfaces:** none.

- [ ] **Step 1: Set the block id locally**

Add to the repo-root `.env` (NOT `frontend/.env`):

```
NEXT_PUBLIC_ADSGRAM_BLOCK_ID=int-36357
```

- [ ] **Step 2: Lint + build the frontend**

Run: `cd frontend && npm run lint && npm run build`
Expected: lint clean; production build succeeds (Next type-checks during build).

- [ ] **Step 3: Manual sanity check (web)**

Run the app locally in a normal browser, go to `/upload`, pick any image, tap the generate button.
Expected: no network call to `/api/packs`; the "Open in Telegram" CTA appears linking to `https://t.me/stikup_bot?startapp`.

- [ ] **Step 4: Deploy**

Add `NEXT_PUBLIC_ADSGRAM_BLOCK_ID=int-36357` to the droplet's `.env`, then deploy via `scripts/deploy.sh` (ssh) so the frontend rebuilds with the inlined block id.

- [ ] **Step 5: Manual sanity check (Telegram)**

Open the Mini App in Telegram, upload a real ChatGPT grid, tap generate.
Expected: the Adsgram interstitial plays, and after it closes the result page (`/result/[packId]`) appears with the split pack. (Adsgram's dashboard has a test mode if no live fill yet.) If the ad fails to fill, the result still appears.

---

## Self-Review

**Spec coverage:**

- §2.1 Telegram flow (ad ∥ POST, navigate after both) → Task 3 step 4c. ✓
- §2.2 Web funnel (gate generation, CTA) → Task 2 + Task 3. ✓
- §3.1a SDK script → Task 3 step 1. ✓
- §3.1b wrapper → Task 1. ✓
- §3.1c upload page → Task 3. ✓
- §3.1d / §3.3 deep link `?startapp` → Task 2. ✓
- §3.2 backend unchanged → no task (correct). ✓
- §3.4 i18n en/ru → Task 2. ✓
- §4 config/ops (`int-36357`, droplet, rebuild) → Task 4. ✓
- §5 resilience (skipped/error never block) → Task 1 tests + Task 3 best-effort test. ✓
- §6 testing (wrapper unit + page branch) → Tasks 1 & 3. ✓

**Placeholder scan:** none — every step has concrete code/commands.

**Type consistency:** `AdResult` and `showInterstitial(): Promise<AdResult>` defined in Task 1, consumed in Task 3; `adsgramBlockId()` defined Task 1 step 1, consumed by the wrapper same task; `OpenInTelegram` defined Task 2, consumed Task 3. Consistent. ✓
