# Sticker Pack Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the full sticker-pack flow — upload → real backend POST, result page fetching real pack data, new compact action buttons, "Get Stickers" modal, Regenerate, referral unlock, and referral-code capture on landing — replacing all demo stubs.

**Architecture:** Upload page POSTs to `/api/packs` and redirects to the real `/result/<packId>`. The result page client-fetches the pack, renders real stickers via refactored StickerGrid/StickerLightbox props, and provides three compact buttons. A new `GetStickersModal` (portal, mirrors UserDrawer pattern) handles Telegram delivery vs. download. A tiny `ReferralCapture` component reads `?ref=` from the URL and writes a cookie on mount.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, lucide-react, useT() i18n (en.json + ru.json), useConnectionStatus(), useRouter from next/navigation.

---

## File Map

### Files to CREATE

- `frontend/src/components/result/get-stickers-modal.tsx` — portal modal (Telegram deliver vs. client download)
- `frontend/src/components/result/pack-actions.tsx` — three compact bottom buttons (Unlock All, Get Stickers, Regenerate)
- `frontend/src/components/referral-capture.tsx` — reads `?ref=` cookie writer, mounted in root layout

### Files to MODIFY

- `frontend/src/app/upload/page.tsx` — replace demo setTimeout with real POST to `/api/packs`
- `frontend/src/app/result/[packId]/page.tsx` — fetch real pack, build fallback from demo data, single-column layout
- `frontend/src/components/result/sticker-grid.tsx` — accept stickers/freeCount/unlocked as props; remove locked_note block
- `frontend/src/components/result/sticker-lightbox.tsx` — accept stickers with `{index, url}` shape (add `src`/`alt` mapping inside)
- `frontend/src/app/layout.tsx` — mount `<ReferralCapture />` inside body
- `frontend/src/i18n/messages/en.json` — add new keys, remove orphaned paywall/quota keys
- `frontend/src/i18n/messages/ru.json` — mirror en.json structure

### Files to DELETE

- `frontend/src/components/result/side-panel.tsx`
- `frontend/src/components/result/paywall-card.tsx`
- `frontend/src/components/result/quota-card.tsx`
- `frontend/src/components/result/actions-row.tsx`
- `frontend/src/components/result/action-button.tsx`

---

## Task 1: Update i18n keys (en.json + ru.json)

**Files:**

- Modify: `frontend/src/i18n/messages/en.json`
- Modify: `frontend/src/i18n/messages/ru.json`

Do this first so that subsequent component tasks can reference the keys without TypeScript errors.

- [ ] **Step 1: Edit en.json — remove orphaned keys and add new ones**

In `frontend/src/i18n/messages/en.json`, make the following changes to the `"result"` section:

1. **Remove** `"result.paywall"` and `"result.quota"` blocks entirely.
2. **Remove** `"result.sticker_grid.locked_note"` key.
3. **Add** new keys to `"result.actions"`:

```json
"result": {
  "header": { ...unchanged... },
  "sticker_grid": {
    "unlocked": "{count} unlocked",
    "locked": "{count} locked",
    "sticker_n": "Sticker {n}",
    "locked_sticker": "Locked sticker"
  },
  "lightbox": { ...unchanged... },
  "actions": {
    "unlock_all": "Unlock all {count}",
    "unlocked": "Unlocked",
    "get_stickers": "Get stickers",
    "regenerate": "Regenerate",
    "take_free": "Take {count} free",
    "install_telegram": "Install to Telegram",
    "sending_telegram": "Sending to Telegram…",
    "regen_left": "1 free regen left",
    "recommended": "Recommended",
    "link_copied": "Link copied!",
    "copying_link": "Copying link…"
  },
  "get_stickers_modal": {
    "title": "Get your stickers",
    "get_in_telegram": "Get in Telegram",
    "get_in_telegram_desc": "The bot will install the pack straight into your Telegram.",
    "download": "Download",
    "download_desc": "Save each sticker as a .webp file to your device.",
    "connect_telegram_prompt": "Connect your Telegram account in Settings to receive stickers via bot.",
    "go_to_settings": "Go to Settings",
    "close": "Close"
  }
}
```

4. **Add** to `"upload.error"`:

```json
"generation_failed": "Generation failed. Please try again."
```

The final `en.json` `result` block (full replacement):

```json
"result": {
  "header": {
    "eyebrow": "Pack ready",
    "title": "Your sticker pack is alive.",
    "description": "All 12 generated. 3 free, 9 unlock with the pack.",
    "selfie_alt": "Your selfie"
  },
  "sticker_grid": {
    "unlocked": "{count} unlocked",
    "locked": "{count} locked",
    "sticker_n": "Sticker {n}",
    "locked_sticker": "Locked sticker"
  },
  "lightbox": {
    "label": "Sticker preview",
    "close": "Close preview",
    "prev": "Previous sticker",
    "next": "Next sticker"
  },
  "actions": {
    "unlock_all": "Unlock all {count}",
    "unlocked": "Unlocked",
    "get_stickers": "Get stickers",
    "regenerate": "Regenerate",
    "take_free": "Take {count} free",
    "install_telegram": "Install to Telegram",
    "sending_telegram": "Sending to Telegram…",
    "regen_left": "1 free regen left",
    "recommended": "Recommended",
    "link_copied": "Link copied!",
    "copying_link": "Copying link…"
  },
  "get_stickers_modal": {
    "title": "Get your stickers",
    "get_in_telegram": "Get in Telegram",
    "get_in_telegram_desc": "The bot will install the pack straight into your Telegram.",
    "download": "Download",
    "download_desc": "Save each sticker as a .webp file to your device.",
    "connect_telegram_prompt": "Connect your Telegram account in Settings to receive stickers via bot.",
    "go_to_settings": "Go to Settings",
    "close": "Close"
  }
}
```

- [ ] **Step 2: Mirror changes in ru.json**

Apply the exact same structural changes to `frontend/src/i18n/messages/ru.json`:

```json
"result": {
  "header": {
    "eyebrow": "Пак готов",
    "title": "Ваш пак стикеров готов.",
    "description": "Все 12 сгенерированы. 3 бесплатно, 9 открываются вместе с паком.",
    "selfie_alt": "Ваш селфи"
  },
  "sticker_grid": {
    "unlocked": "{count} открыто",
    "locked": "{count} заблокировано",
    "sticker_n": "Стикер {n}",
    "locked_sticker": "Заблокированный стикер"
  },
  "lightbox": {
    "label": "Просмотр стикера",
    "close": "Закрыть просмотр",
    "prev": "Предыдущий стикер",
    "next": "Следующий стикер"
  },
  "actions": {
    "unlock_all": "Разблокировать все {count}",
    "unlocked": "Разблокировано",
    "get_stickers": "Получить стикеры",
    "regenerate": "Перегенерировать",
    "take_free": "Взять {count} бесплатно",
    "install_telegram": "Установить в Telegram",
    "sending_telegram": "Отправляем в Telegram…",
    "regen_left": "1 бесплатная перегенерация",
    "recommended": "Рекомендуем",
    "link_copied": "Ссылка скопирована!",
    "copying_link": "Копируем ссылку…"
  },
  "get_stickers_modal": {
    "title": "Получить стикеры",
    "get_in_telegram": "Получить в Telegram",
    "get_in_telegram_desc": "Бот установит пак прямо в ваш Telegram.",
    "download": "Скачать",
    "download_desc": "Сохраните каждый стикер как .webp-файл на устройство.",
    "connect_telegram_prompt": "Привяжите Telegram-аккаунт в настройках, чтобы получать стикеры через бота.",
    "go_to_settings": "Открыть настройки",
    "close": "Закрыть"
  }
}
```

Also add to `upload.error` in ru.json:

```json
"generation_failed": "Ошибка генерации. Попробуйте ещё раз."
```

- [ ] **Step 3: Verify JSON parses and keys match**

```bash
cd /Users/garikmartikyan03gmail.com/Desktop/stickup-beta/frontend
node -e "
  const en = require('./src/i18n/messages/en.json');
  const ru = require('./src/i18n/messages/ru.json');
  const enKeys = JSON.stringify(Object.keys(en).sort());
  const ruKeys = JSON.stringify(Object.keys(ru).sort());
  console.log('Top-level match:', enKeys === ruKeys);
  console.log('en result keys:', Object.keys(en.result).sort());
  console.log('ru result keys:', Object.keys(ru.result).sort());
  console.log('No paywall in en:', !en.result.paywall);
  console.log('No quota in en:', !en.result.quota);
"
```

Expected output:

```
Top-level match: true
en result keys: [ 'actions', 'get_stickers_modal', 'header', 'lightbox', 'sticker_grid' ]
ru result keys: [ 'actions', 'get_stickers_modal', 'header', 'lightbox', 'sticker_grid' ]
No paywall in en: true
No quota in en: true
```

---

## Task 2: Refactor StickerGrid to accept props

**Files:**

- Modify: `frontend/src/components/result/sticker-grid.tsx`

The current `StickerGrid` imports `ALL_STICKERS`, `FREE_COUNT`, `PACK_SIZE` from `./data` and has no props. We need it to accept the real sticker list and locking state.

- [ ] **Step 1: Rewrite sticker-grid.tsx**

Replace the entire file content:

```tsx
'use client';

import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { StickerCard } from '@/components/sticker-card';
import { StickerLightbox } from './sticker-lightbox';
import { useT } from '@/components/language-provider';

export type StickerItem = {
  index: number;
  url: string;
};

type StickerGridProps = {
  stickers: StickerItem[];
  freeCount: number;
  unlocked: boolean;
};

export function StickerGrid({
  stickers,
  freeCount,
  unlocked,
}: StickerGridProps) {
  const t = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const lockedCount = unlocked ? 0 : Math.max(0, stickers.length - freeCount);
  const unlockedCount = stickers.length - lockedCount;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)] md:p-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span>
            {t('result.sticker_grid.unlocked', { count: unlockedCount })}
          </span>
        </div>
        {lockedCount > 0 && (
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-fg)] text-[var(--color-bg)]">
              <Lock className="h-3 w-3" />
            </span>
            <span>
              {t('result.sticker_grid.locked', { count: lockedCount })}
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {stickers.map((s, i) => {
          const isLocked = !unlocked && i >= freeCount;
          return (
            <button
              key={s.index}
              type="button"
              onClick={() => !isLocked && setOpenIndex(i)}
              className="group relative transition"
              aria-label={
                isLocked
                  ? t('result.sticker_grid.locked_sticker')
                  : t('result.sticker_grid.sticker_n', { n: s.index + 1 })
              }
            >
              <StickerCard
                src={s.url}
                alt={`Sticker ${s.index + 1}`}
                locked={isLocked}
                rotate={isLocked ? 0 : (i - 1) * 2}
                delay={i * 60}
                popIn
              />
              {!isLocked && (
                <div className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-success)] text-white shadow-md">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <StickerLightbox
        stickers={stickers}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </div>
  );
}
```

Note: `StickerLightbox` is updated next to accept the new `StickerItem` shape.

---

## Task 3: Refactor StickerLightbox to accept StickerItem props

**Files:**

- Modify: `frontend/src/components/result/sticker-lightbox.tsx`

The lightbox currently accepts `{ src: string; alt: string }[]`. We change it to accept `StickerItem[]` (with `index` and `url`), deriving `src` and `alt` internally.

- [ ] **Step 1: Rewrite sticker-lightbox.tsx**

Replace the entire file content:

```tsx
'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/components/language-provider';
import type { StickerItem } from './sticker-grid';

type StickerLightboxProps = {
  stickers: StickerItem[];
  /** Index into `stickers` array (NOT sticker.index), or null when closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function StickerLightbox({
  stickers,
  index,
  onClose,
  onNavigate,
}: StickerLightboxProps) {
  const t = useT();
  const [mounted, setMounted] = useState(false);
  const open = index !== null;
  const total = stickers.length;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate
    setMounted(true);
  }, []);

  const goPrev = useCallback(() => {
    if (index === null || total === 0) return;
    onNavigate((index - 1 + total) % total);
  }, [index, total, onNavigate]);

  const goNext = useCallback(() => {
    if (index === null || total === 0) return;
    onNavigate((index + 1) % total);
  }, [index, total, onNavigate]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') goPrev();
      else if (event.key === 'ArrowRight') goNext();
    }
    if (open) document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, goPrev, goNext]);

  if (!mounted || index === null) return null;

  const current = stickers[index];
  if (!current) return null;

  const src = current.url;
  const alt = `Sticker ${current.index + 1}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('result.lightbox.label')}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-black/55 backdrop-blur-[4px] animate-[fade-in_180ms_ease-out]"
      />

      <button
        type="button"
        onClick={onClose}
        aria-label={t('result.lightbox.close')}
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {total > 1 && (
        <button
          type="button"
          onClick={goPrev}
          aria-label={t('result.lightbox.prev')}
          className="absolute left-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:-translate-x-0.5 hover:bg-white/20 md:left-8"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      <div className="relative z-[5] flex flex-col items-center gap-5">
        <div className="grid place-items-center rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-md md:p-10">
          <Image
            key={src}
            src={src}
            alt={alt}
            width={420}
            height={420}
            priority
            className="h-[min(64vw,22rem)] w-[min(64vw,22rem)] animate-[pop-in_320ms_cubic-bezier(0.34,1.56,0.64,1)] object-contain"
          />
        </div>
        {total > 1 && (
          <div className="rounded-full bg-white/10 px-4 py-1.5 font-mono text-sm font-semibold text-white/90 backdrop-blur">
            {index + 1} / {total}
          </div>
        )}
      </div>

      {total > 1 && (
        <button
          type="button"
          onClick={goNext}
          aria-label={t('result.lightbox.next')}
          className="absolute right-4 z-10 grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:translate-x-0.5 hover:bg-white/20 md:right-8"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>,
    document.body,
  );
}
```

---

## Task 4: Create GetStickersModal

**Files:**

- Create: `frontend/src/components/result/get-stickers-modal.tsx`

This modal mirrors the UserDrawer portal pattern (createPortal, mounted gate, Escape, body-scroll lock, backdrop click to close). It offers two options: "Get in Telegram" and "Download".

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Send, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { useConnectionStatus } from '@/lib/hooks/use-connection-status';
import { useT } from '@/components/language-provider';
import type { StickerItem } from './sticker-grid';

type GetStickersModalProps = {
  packId: string;
  stickers: StickerItem[];
  open: boolean;
  onClose: () => void;
};

export function GetStickersModal({
  packId,
  stickers,
  open,
  onClose,
}: GetStickersModalProps) {
  const t = useT();
  const { telegramConnected } = useConnectionStatus();
  const [mounted, setMounted] = useState(false);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  async function handleTelegram() {
    if (telegramBusy) return;

    if (!telegramConnected) {
      // Not connected — we show the settings prompt in the modal instead.
      return;
    }

    setTelegramBusy(true);
    try {
      const res = await fetch(
        `/api/packs/${encodeURIComponent(packId)}/deliver-telegram`,
        { method: 'POST', credentials: 'include', keepalive: true },
      );
      if (!res.ok) throw new Error(`deliver-telegram ${res.status}`);
      const data = (await res.json()) as {
        delivered: boolean;
        botUrl: string;
        needsTelegram?: boolean;
        alreadyClaimed?: boolean;
      };
      // If the backend says Telegram isn't connected, treat as unconnected.
      if (data.needsTelegram) {
        setTelegramBusy(false);
        return;
      }
      window.location.href = data.botUrl;
    } catch {
      setTelegramBusy(false);
    }
  }

  async function handleDownload() {
    if (downloadBusy) return;
    setDownloadBusy(true);

    for (const sticker of stickers) {
      try {
        const res = await fetch(sticker.url);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sticker_${sticker.index + 1}.webp`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // best-effort per sticker
      }
    }

    setDownloadBusy(false);
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[3px] transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('result.get_stickers_modal.title')}
        className={`fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-sm rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-2xl transition-all duration-300 sm:bottom-auto sm:top-1/2 sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 ${
          open
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            {t('result.get_stickers_modal.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('result.get_stickers_modal.close')}
            className="grid h-8 w-8 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)] transition hover:text-[var(--color-fg)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {/* Get in Telegram option */}
          {telegramConnected ? (
            <button
              type="button"
              onClick={handleTelegram}
              disabled={telegramBusy}
              className="flex w-full items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 text-left transition hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 disabled:cursor-wait disabled:opacity-70"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                <Send className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <div className="font-semibold text-[var(--color-fg)]">
                  {telegramBusy
                    ? t('result.actions.sending_telegram')
                    : t('result.get_stickers_modal.get_in_telegram')}
                </div>
                <div className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                  {t('result.get_stickers_modal.get_in_telegram_desc')}
                </div>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] p-4">
              <div className="flex items-start gap-3">
                <Settings className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-fg-muted)]" />
                <div>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    {t('result.get_stickers_modal.connect_telegram_prompt')}
                  </p>
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] px-4 py-1.5 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
                  >
                    {t('result.get_stickers_modal.go_to_settings')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Download option */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloadBusy}
            className="flex w-full items-start gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 text-left transition hover:border-[var(--color-border-strong)] disabled:cursor-wait disabled:opacity-70"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-bg-sunk)] text-[var(--color-fg)]">
              <Download className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-semibold text-[var(--color-fg)]">
                {downloadBusy
                  ? 'Downloading…'
                  : t('result.get_stickers_modal.download')}
              </div>
              <div className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                {t('result.get_stickers_modal.download_desc')}
              </div>
            </div>
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
```

---

## Task 5: Create PackActions (compact bottom button row)

**Files:**

- Create: `frontend/src/components/result/pack-actions.tsx`

Three small/compact buttons: "Unlock all {n}", "Get stickers", "Regenerate". The Unlock button triggers referral share; if already unlocked it shows a check state. Get Stickers opens the modal. Regenerate deletes the pack and navigates to /upload.

- [ ] **Step 1: Create pack-actions.tsx**

```tsx
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download, RefreshCw, Unlock } from 'lucide-react';
import { GetStickersModal } from './get-stickers-modal';
import { useT } from '@/components/language-provider';
import type { StickerItem } from './sticker-grid';

type PackActionsProps = {
  packId: string;
  packSize: number;
  unlocked: boolean;
  stickers: StickerItem[];
};

export function PackActions({
  packId,
  packSize,
  unlocked,
  stickers,
}: PackActionsProps) {
  const t = useT();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);

  const handleUnlock = useCallback(async () => {
    if (unlocked || unlockBusy) return;
    setUnlockBusy(true);

    try {
      const res = await fetch('/api/referral/me', { credentials: 'include' });
      if (!res.ok) throw new Error(`referral/me ${res.status}`);
      const data = (await res.json()) as {
        code: string;
        link: string;
        unlocked: boolean;
      };

      // Try Web Share API first (mobile browsers), fall back to clipboard.
      const shared =
        typeof navigator.share === 'function'
          ? await navigator
              .share({ url: data.link })
              .then(() => true)
              .catch(() => false)
          : false;

      if (!shared) {
        await navigator.clipboard.writeText(data.link);
      }

      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // best-effort
    } finally {
      setUnlockBusy(false);
    }
  }, [unlocked, unlockBusy]);

  const handleRegenerate = useCallback(async () => {
    if (regenBusy) return;
    setRegenBusy(true);
    // Best-effort DELETE — ignore failure, user wants to start over.
    await fetch(`/api/packs/${encodeURIComponent(packId)}`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => {});
    router.push('/upload');
  }, [packId, regenBusy, router]);

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {/* Unlock all / Unlocked check */}
        {unlocked ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-success)]">
            <Check className="h-4 w-4" strokeWidth={3} />
            {t('result.actions.unlocked')}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleUnlock}
            disabled={unlockBusy}
            className="shimmer inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-5 py-2 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
          >
            {linkCopied ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} />
                {t('result.actions.link_copied')}
              </>
            ) : unlockBusy ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t('result.actions.copying_link')}
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" strokeWidth={2.2} />
                {t('result.actions.unlock_all', { count: packSize })}
              </>
            )}
          </button>
        )}

        {/* Get stickers */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-2 text-sm font-semibold text-[var(--color-fg)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
        >
          <Download className="h-4 w-4" strokeWidth={2.2} />
          {t('result.actions.get_stickers')}
        </button>

        {/* Regenerate */}
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={regenBusy}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-transparent px-5 py-2 text-sm font-semibold text-[var(--color-fg-muted)] transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)] disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${regenBusy ? 'animate-spin' : ''}`}
            strokeWidth={2.2}
          />
          {t('result.actions.regenerate')}
        </button>
      </div>

      <GetStickersModal
        packId={packId}
        stickers={stickers}
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
```

---

## Task 6: Rewrite the result page

**Files:**

- Modify: `frontend/src/app/result/[packId]/page.tsx`

The page now: fetches the real pack on mount, builds a demo fallback on 404/error, renders StickerGrid + PackActions in a single-column layout, removes SidePanel and the old ActionsRow.

- [ ] **Step 1: Rewrite result/[packId]/page.tsx**

```tsx
'use client';

import { use, useEffect, useState } from 'react';
import { ResultHeader } from '@/components/result/result-header';
import { StickerGrid } from '@/components/result/sticker-grid';
import { PackActions } from '@/components/result/pack-actions';
import { ALL_STICKERS, FREE_COUNT, PACK_SIZE } from '@/components/result/data';
import type { StickerItem } from '@/components/result/sticker-grid';

type Pack = {
  id: string;
  status: 'generating' | 'ready' | 'failed';
  unlocked: boolean;
  freeCount: number;
  packSize: number;
  stickers: StickerItem[];
};

function buildDemoPack(packId: string): Pack {
  return {
    id: packId,
    status: 'ready',
    unlocked: false,
    freeCount: FREE_COUNT,
    packSize: PACK_SIZE,
    stickers: ALL_STICKERS.map((s, i) => ({ index: i, url: s.src })),
  };
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = use(params);
  const [pack, setPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/packs/${encodeURIComponent(packId)}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404 || res.status === 403) {
          setPack(buildDemoPack(packId));
          return;
        }
        if (!res.ok) {
          setPack(buildDemoPack(packId));
          return;
        }
        const data = (await res.json()) as {
          id: string;
          status: 'generating' | 'ready' | 'failed';
          unlocked: boolean;
          freeCount: number;
          packSize: number;
          stickers: Array<{ index: number; url: string }>;
        };
        setPack({
          id: data.id,
          status: data.status,
          unlocked: data.unlocked,
          freeCount: data.freeCount,
          packSize: data.packSize,
          stickers: data.stickers,
        });
      })
      .catch(() => {
        if (!cancelled) setPack(buildDemoPack(packId));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [packId]);

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-6 md:py-10">
        <ResultHeader />

        <section
          className="reveal mt-6 md:mt-8"
          style={{ animationDelay: '100ms' }}
        >
          {loading ? (
            <div className="flex items-center justify-center rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-20 shadow-[var(--shadow-card)]">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--color-brand)]/30 border-t-[var(--color-brand)]" />
            </div>
          ) : pack ? (
            <>
              <StickerGrid
                stickers={pack.stickers}
                freeCount={pack.freeCount}
                unlocked={pack.unlocked}
              />
              <PackActions
                packId={packId}
                packSize={pack.packSize}
                unlocked={pack.unlocked}
                stickers={pack.stickers}
              />
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
```

---

## Task 7: Wire the upload page to the real backend

**Files:**

- Modify: `frontend/src/app/upload/page.tsx`

Replace the TODO/setTimeout stub with a real POST to `/api/packs`.

- [ ] **Step 1: Replace the submit callback in upload/page.tsx**

The file already imports `useCallback`, `useState`, etc. Add `useRouter` import and replace the `submit` function.

At the top of the file, add:

```tsx
import { useRouter } from 'next/navigation';
```

Inside the component, add:

```tsx
const router = useRouter();
```

Replace the entire `submit` callback:

```tsx
const submit = useCallback(async () => {
  if (state.kind !== 'ready') return;
  setSubmitting(true);

  try {
    const form = new FormData();
    form.append('image', state.file);

    const res = await fetch('/api/packs', {
      method: 'POST',
      body: form,
      credentials: 'include',
    });

    if (res.status === 401) {
      router.push('/login');
      return;
    }

    if (!res.ok) {
      setState({
        kind: 'error',
        message: t('upload.error.generation_failed'),
      });
      setSubmitting(false);
      return;
    }

    const { packId } = (await res.json()) as { packId: string };
    router.push(`/result/${packId}`);
  } catch {
    setState({
      kind: 'error',
      message: t('upload.error.generation_failed'),
    });
    setSubmitting(false);
  }
}, [state, router, t]);
```

Note: `setSubmitting(false)` is intentionally NOT called on success because we're navigating away — React will unmount the component.

---

## Task 8: Delete removed components

**Files:**

- Delete: `frontend/src/components/result/side-panel.tsx`
- Delete: `frontend/src/components/result/paywall-card.tsx`
- Delete: `frontend/src/components/result/quota-card.tsx`
- Delete: `frontend/src/components/result/actions-row.tsx`
- Delete: `frontend/src/components/result/action-button.tsx`

- [ ] **Step 1: Delete the files**

```bash
cd /Users/garikmartikyan03gmail.com/Desktop/stickup-beta/frontend
rm src/components/result/side-panel.tsx
rm src/components/result/paywall-card.tsx
rm src/components/result/quota-card.tsx
rm src/components/result/actions-row.tsx
rm src/components/result/action-button.tsx
```

- [ ] **Step 2: Verify no imports remain**

```bash
cd /Users/garikmartikyan03gmail.com/Desktop/stickup-beta/frontend
grep -r "side-panel\|paywall-card\|quota-card\|actions-row\|action-button" src/ --include="*.tsx" --include="*.ts"
```

Expected: no output.

---

## Task 9: Create ReferralCapture component

**Files:**

- Create: `frontend/src/components/referral-capture.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client';

import { useEffect } from 'react';

/**
 * Reads the `?ref=` query parameter from the current URL and writes a
 * `stikup_ref` cookie so the backend can credit a referral on registration.
 * The cookie is intentionally non-httpOnly (set client-side) because the
 * backend reads it via the Cookie header on the register endpoint.
 * Max-age: 30 days (2592000 seconds).
 */
export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && /^[\w-]{1,64}$/.test(ref)) {
      document.cookie = `stikup_ref=${encodeURIComponent(ref)}; path=/; max-age=2592000; samesite=lax`;
    }
  }, []);

  return null;
}
```

---

## Task 10: Mount ReferralCapture in root layout

**Files:**

- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Add the import and mount the component**

In `frontend/src/app/layout.tsx`, add the import after the existing imports:

```tsx
import { ReferralCapture } from '@/components/referral-capture';
```

Inside `<body>`, add `<ReferralCapture />` as the first child inside `<ThemeProvider>` (or directly before `<AppHeader>`). The final layout body should look like:

```tsx
<body className="min-h-dvh flex flex-col">
  <ThemeProvider>
    <LanguageProvider>
      <StoreProvider>
        <ReferralCapture />
        <AppHeader loggedIn={loggedIn} />
        {children}
      </StoreProvider>
    </LanguageProvider>
  </ThemeProvider>
</body>
```

---

## Task 11: Final verification

**Files:** none — run checks only.

- [ ] **Step 1: Run TypeScript typecheck**

```bash
cd /Users/garikmartikyan03gmail.com/Desktop/stickup-beta/frontend
npm run typecheck
```

Expected: exit 0, no errors.

- [ ] **Step 2: Run ESLint**

```bash
cd /Users/garikmartikyan03gmail.com/Desktop/stickup-beta/frontend
npm run lint
```

Expected: exit 0, no errors or warnings treated as errors.

- [ ] **Step 3: Run production build**

```bash
cd /Users/garikmartikyan03gmail.com/Desktop/stickup-beta/frontend
npm run build
```

Expected: "Route (app)" table printed, exit 0. No "Type error" lines.

- [ ] **Step 4: Verify JSON key parity**

```bash
cd /Users/garikmartikyan03gmail.com/Desktop/stickup-beta/frontend
node -e "
  const en = require('./src/i18n/messages/en.json');
  const ru = require('./src/i18n/messages/ru.json');
  function flatKeys(obj, prefix='') {
    return Object.entries(obj).flatMap(([k,v]) =>
      typeof v === 'object' && v !== null
        ? flatKeys(v, prefix ? prefix+'.'+k : k)
        : [prefix ? prefix+'.'+k : k]
    );
  }
  const enK = flatKeys(en).sort();
  const ruK = flatKeys(ru).sort();
  const missing = enK.filter(k => !ruK.includes(k));
  const extra = ruK.filter(k => !enK.includes(k));
  if (missing.length) console.error('Missing in ru:', missing);
  if (extra.length) console.error('Extra in ru:', extra);
  if (!missing.length && !extra.length) console.log('All keys match!');
"
```

Expected: `All keys match!`

---

## Notes for the reviewer

1. **`language-provider.tsx` type guard**: The file does `const _ruCheck: Messages = ruMessages` which enforces structural parity between `en.json` and `ru.json` at compile time. Removing `result.paywall` / `result.quota` from both files will keep this check passing.

2. **Demo fallback**: `/result/demo` still works because the fetch to `/api/packs/demo` will 404, triggering `buildDemoPack("demo")` which uses `ALL_STICKERS` from `data.ts`. That file is untouched.

3. **`shimmer` CSS class**: Used in PackActions for the gradient button — this class is already used by PaywallCard and ActionButton in the existing codebase, so it exists in `globals.css`.

4. **Image domains**: Sticker URLs like `/assets/sticker_3.webp` are served by the frontend's own `public/assets/` directory (same-origin), so no `next.config.ts` `remotePatterns` changes are needed.

5. **`navigator.share` guard**: The PackActions component guards `typeof navigator.share === "function"` before calling it, which satisfies TypeScript and handles browsers without the API.
