'use client';

import Image from 'next/image';
import { STICKER_STYLES, type StyleId } from '@/lib/sticker-styles';

const STYLE_PREVIEW: Record<StyleId, string> = {
  chibi: '/assets/chibi/sticker_8.webp',
  disney3d: '/assets/disney/disney-styled_08.webp',
  anime: '/assets/anime/anime-styled_08.webp',
  pixel: '/assets/pixel/pixel-styled_08.webp',
};

type StylePickerProps = {
  selected: StyleId;
  onSelect: (id: StyleId) => void;
};

export function StylePicker({ selected, onSelect }: StylePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Art styles"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {STICKER_STYLES.map((style) => {
        const isSelected = style.id === selected;
        return (
          <button
            key={style.id}
            role="radio"
            aria-checked={isSelected}
            type="button"
            onClick={() => onSelect(style.id)}
            className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-4 text-center transition-all duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] ${
              isSelected
                ? 'border-[var(--color-brand)] bg-gradient-to-b from-[rgba(var(--color-brand-rgb),0.08)] to-[var(--color-bg-elev)] shadow-[0_0_0_4px_rgba(var(--color-brand-rgb),0.15),0_8px_24px_-6px_rgba(var(--color-brand-rgb),0.3)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-elev)] hover:border-[var(--color-border-strong)]'
            }`}
          >
            {isSelected && (
              <span className="absolute right-4.5 top-4.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand)]">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4l2.5 2.5L9 1"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
            <div
              className={`overflow-hidden rounded-xl shadow-md transition-transform duration-200 ${isSelected ? 'scale-105' : ''}`}
              style={{ width: 128, height: 128 }}
            >
              <Image
                src={STYLE_PREVIEW[style.id]}
                alt={style.name}
                width={128}
                height={128}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div
                className={`text-base font-semibold leading-tight transition-colors ${isSelected ? 'text-[var(--color-brand)]' : 'text-[var(--color-fg)]'}`}
              >
                {style.name}
              </div>
              <div className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
                {style.tagline}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
