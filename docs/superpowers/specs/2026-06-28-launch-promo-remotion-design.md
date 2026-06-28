# Launch Promo Video — Design Spec

**Date:** 2026-06-28
**Status:** Approved, implementing
**Project:** `video generation/` (Remotion), new isolated `src/promo/` module

## Goal

A short, scroll-stopping **launch/marketing** promo for stikup.app — distinct
from the existing how-to/tutorial videos. Sells the product's magic (your face →
a whole sticker pack) in the first 2 seconds.

## Locked parameters

| Parameter  | Decision                                                                      |
| ---------- | ----------------------------------------------------------------------------- |
| Format     | Vertical 9:16, **1080×1920** native (render scale 1)                          |
| Concept    | **Transformation reveal** — selfie → 12 stickers                              |
| Length     | ~12s (target 8–15s)                                                           |
| Language   | English only                                                                  |
| Audio      | **Silent / text-driven** (mute-safe); creator adds a trending sound on upload |
| Lead style | Disney 3D (only full 12-sticker asset set); anime/chibi/pixel teased          |
| CTA        | "Make your pack — free" · `stikup.app` · "Open in Telegram" cue               |

## Why native 1080×1920 (not the 432×2.5 trick)

The tutorial renders the real website at a 432px CSS viewport (so Tailwind's
mobile breakpoints fire) and upscales ×2.5. The promo is **custom motion
graphics**, not the live website UI, so it has no viewport dependency — authoring
at full 1080×1920 gives crisp native text with no upscaling blur. No responsive
(`sm:`/`md:`) Tailwind prefixes are used.

## Storyboard (30fps, 1080×1920, ~360 frames)

| #   | Scene       | Frames         | Beat                                                                                                                                 |
| --- | ----------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Hook        | 0–54 (1.8s)    | Real selfie springs into a framed card; kinetic headline "Turn your face into stickers."                                             |
| 2   | Reveal      | 54–120 (2.2s)  | A bright scan sweep wipes across the selfie; behind it the face becomes a Disney sticker. Pop + flash.                               |
| 3   | Cascade     | 120–192 (2.4s) | The sticker multiplies — 12 stickers pop into a 3×4 grid (staggered). Caption "12 of you. One pack."                                 |
| 4   | Steps       | 192–264 (2.4s) | Three rapid cards: pick a style (4 style chips) → paste 1 ChatGPT prompt → 12 stickers free. Caption "No design skills. ~2 minutes." |
| 5   | Personality | 264–306 (1.4s) | 3–4 favorite stickers bounce/wiggle playfully — they feel alive.                                                                     |
| 6   | CTA         | 306–360 (1.8s) | Logo + "Make your pack — free" + `stikup.app` + Telegram pill. Loop-friendly end card.                                               |

## Architecture

```
src/promo/
  promo.ts            # constants: dims, per-scene durations, colors, asset paths, copy
  ui.tsx              # shared: PromoBg (persistent glow), Word kinetic text, helpers
  LaunchPromo.tsx     # root: persistent <PromoBg/> behind a <Series> of 6 scenes
  scenes/
    HookScene.tsx
    RevealScene.tsx
    CascadeScene.tsx
    StepsScene.tsx
    PersonalityScene.tsx
    CTAScene.tsx
```

- **Persistent background.** `PromoBg` renders OUTSIDE the `Series` so the dark
  brand-glow backdrop is continuous; only foreground content swaps per scene.
  This turns Series' hard cuts into "elements morph on a steady background".
- **Per-scene entrance.** Every scene's foreground springs/pops in over its first
  ~6–12 frames, softening each cut without overlapping sequences.
- **Reuse.** Follows existing patterns: `spring`/`interpolate`/`staticFile`/`Img`,
  the `popIn` cascade helper, design tokens from `tailwind.css` (`--color-brand`
  #e0349a, `--color-brand-2` #ffb422, `--color-accent` #1ec8ff), and the
  Bricolage/Geist fonts already loaded in `src/fonts.ts`. Root is wrapped in
  `className="dark"` for the dark token values.

## Registration & render

- New `<Composition id="LaunchPromo">` in `src/Root.tsx`, 1080×1920, 30fps,
  `PROMO_DURATION` frames. Existing compositions untouched.
- `package.json` script: `render:promo` → `remotion render LaunchPromo out/launch-promo.mp4 --overwrite`.

## Out of scope (YAGNI)

- No Russian cut (English only this pass).
- No baked-in audio track.
- No 1:1 / 16:9 crops (vertical master only).
- No changes to the existing how-to compositions.
