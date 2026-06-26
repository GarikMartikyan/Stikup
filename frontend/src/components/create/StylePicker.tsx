"use client";

import {
  Brush,
  Cpu,
  Film,
  Heart,
  Layers,
  Palette,
  Sparkles,
  Zap,
} from "lucide-react";
import { type StyleId, STICKER_STYLES } from "@/lib/sticker-styles";

// TODO: Replace these icon tiles with real sample art images when available.
// Drop a 200×200px image in /public/assets/styles/<id>.webp and swap the icon
// for an <Image> with the same layout.
const STYLE_ICONS: Record<
  StyleId,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  chibi: Heart,
  disney3d: Film,
  anime: Sparkles,
  ghibli: Brush,
  comic: Zap,
  pixel: Cpu,
  clay: Layers,
  popart: Palette,
};

const STYLE_COLORS: Record<StyleId, string> = {
  chibi: "from-pink-400 to-rose-300",
  disney3d: "from-blue-400 to-indigo-400",
  anime: "from-purple-400 to-fuchsia-400",
  ghibli: "from-emerald-400 to-teal-300",
  comic: "from-yellow-400 to-orange-400",
  pixel: "from-cyan-400 to-sky-400",
  clay: "from-amber-400 to-orange-300",
  popart: "from-red-400 to-pink-400",
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
        const Icon = STYLE_ICONS[style.id];
        const gradient = STYLE_COLORS[style.id];
        const isSelected = style.id === selected;
        return (
          <button
            key={style.id}
            role="radio"
            aria-checked={isSelected}
            type="button"
            onClick={() => onSelect(style.id)}
            className={`group flex flex-col gap-3 rounded-2xl border-2 bg-[var(--color-bg-elev)] p-4 text-left transition hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] ${
              isSelected
                ? "border-[var(--color-brand)] shadow-[0_0_0_3px_rgba(var(--color-brand-rgb),0.18)]"
                : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
            }`}
          >
            {/* TODO: swap this gradient tile for a real sample image when available */}
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow`}
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <div className="font-semibold text-[var(--color-fg)] text-sm leading-tight">
                {style.name}
              </div>
              <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                {style.tagline}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
