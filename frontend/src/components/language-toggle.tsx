'use client';

import { useEffect, useRef, useState } from 'react';
import {
  type Language,
  LANGUAGES,
  useLanguage,
} from '@/components/language-provider';

function GbFlag({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 30"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <clipPath id="lt-uk-s">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath="url(#lt-uk-s)"
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

function RuFlag({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 9 6"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <rect width="9" height="2" fill="#fff" />
      <rect width="9" height="2" y="2" fill="#0039A6" />
      <rect width="9" height="2" y="4" fill="#D52B1E" />
    </svg>
  );
}

function Flag({
  value,
  className = '',
}: {
  value: Language;
  className?: string;
}) {
  return value === 'ru' ? (
    <RuFlag className={className} />
  ) : (
    <GbFlag className={className} />
  );
}

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot post-hydration gate
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0];

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={current.native}
        suppressHydrationWarning
        className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]"
      >
        {mounted && <Flag value={language} className="h-full w-full" />}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={current.native}
          className="absolute right-0 top-full z-50 mt-2 min-w-[10rem] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] shadow-[var(--shadow-card)]"
        >
          {LANGUAGES.map(({ value, native }) => {
            const active = value === language;
            return (
              <button
                key={value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLanguage(value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition ${
                  active
                    ? 'bg-[var(--color-fg)]/10 text-[var(--color-fg)] hover:bg-[var(--color-fg)]/15'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-sunk)] hover:text-[var(--color-fg)]'
                }`}
              >
                <span className="grid h-5 w-5 place-items-center overflow-hidden rounded-full border border-[var(--color-border)]">
                  <Flag value={value} className="h-full w-full" />
                </span>
                <span className="font-medium">{native}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
