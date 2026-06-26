# Remotion "How to Create Stickers" Video — Design Spec

**Date:** 2026-06-26  
**Status:** Approved  
**Output dir:** `video generation/`

---

## Goal

A 9:16 vertical promotional/tutorial video (~32 seconds) showing how to create a Telegram sticker pack with Stikup. Built entirely in Remotion — no screen recordings, all scenes are React UI mock components. Renders to MP4 + GIF.

---

## Composition

| Property       | Value              |
| -------------- | ------------------ |
| Name           | `HowToVideo`       |
| Width × Height | 1080 × 1920        |
| FPS            | 30                 |
| Total duration | ~990 frames (~33s) |

---

## Scene Breakdown

### Scene 1 — Intro (90 frames / 3s)

- Dark gradient background
- Stikup logo slides in from center with spring animation
- Tagline "Turn your photos into Telegram stickers" fades in below
- Subtle background particle/glow effect

### Scene 2 — Pick Style (120 frames / 4s)

- `AppScreen` phone-frame wrapper
- Mocked `/create` page: header "Pick your style" + 4 style tiles (Chibi, Disney 3D, Anime, Pixel)
- "Disney 3D" tile animates: scale up + colored border highlight at frame ~30
- Caption slides up from bottom: "Pick your art style"

### Scene 3 — Open ChatGPT (90 frames / 3s)

- Zoomed-in view of the button row
- Two buttons visible: outline "Copy Prompt" + green "Open ChatGPT" with external-link icon
- Animated cursor SVG moves from left → lands on green button at frame ~40 → click ripple effect
- Caption: "Open ChatGPT with one tap"

### Scene 4 — Attach Photo in ChatGPT (150 frames / 5s)

- `ChatBubble` mock UI: dark background, ChatGPT logo top-left
- `real_image.webp` slides up as an image attachment bubble at frame ~20
- Prompt text types in character-by-character (truncated to ~80 chars visible)
- Send button pulses → sent at frame ~120
- Caption: "Attach your photo & send the prompt"

### Scene 5 — ChatGPT Generates (150 frames / 5s)

- Same ChatGPT mock UI, user message visible above
- Typing indicator (three bouncing dots) animates for ~60 frames
- `anime/anime-styled.png` sticker grid fades + scales in as ChatGPT's response
- Caption: "ChatGPT generates your sticker sheet"

### Scene 6 — Upload Grid to Stikup (120 frames / 4s)

- `AppScreen` phone-frame wrapper
- Mocked `/upload` page: dashed drop zone, upload icon
- `disney/disney-styled.png` thumbnail slides down into drop zone at frame ~30
- Progress bar animates 0 → 100%
- Caption: "Upload the grid to Stikup"

### Scene 7 — Stickers Ready (180 frames / 6s)

- Dark background
- 12 Disney sticker images (`disney-styled_01.webp` … `disney-styled_12.webp`) arranged in 4×3 grid
- Each sticker pops in with `spring()` animation, staggered by 12 frames per sticker
- Final state: all 12 visible, subtle floating idle animation
- Caption: "Your stickers are ready! 🎉"

### Scene 8 — Outro (90 frames / 3s)

- Stikup logo centered, smaller
- `stikup.app` URL fades in below
- CTA button "Make yours free →" slides up
- Background matches Intro

---

## File Structure

```
video generation/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── public/
│   └── (symlink or copied assets from ../frontend/public/assets/)
│       ├── real_image.webp
│       ├── disney/
│       │   ├── disney-styled.png
│       │   ├── disney-styled_01.webp … disney-styled_12.webp
│       └── anime/
│           └── anime-styled.png
└── src/
    ├── Root.tsx                  # registers HowToVideo composition
    ├── HowToVideo.tsx            # <Series> of all 8 scenes
    ├── scenes/
    │   ├── Intro.tsx
    │   ├── PickStyle.tsx
    │   ├── OpenChatGPT.tsx
    │   ├── AttachPhoto.tsx
    │   ├── ChatGPTGenerates.tsx
    │   ├── UploadGrid.tsx
    │   ├── StickersReady.tsx
    │   └── Outro.tsx
    └── components/
        ├── AppScreen.tsx         # phone frame wrapper component
        ├── ChatMock.tsx          # simplified ChatGPT UI mock
        ├── Caption.tsx           # animated bottom caption bar
        └── Cursor.tsx            # animated SVG cursor
```

---

## Key Dependencies

```json
{
  "remotion": "^4.x",
  "@remotion/cli": "^4.x",
  "@remotion/renderer": "^4.x",
  "react": "^18",
  "react-dom": "^18",
  "typescript": "^5"
}
```

GIF rendering: `ffmpeg` post-process from the MP4 output (no extra npm dep).

---

## Animation Primitives

- **Spring pops:** `spring({ fps, frame, config: { stiffness: 200, damping: 20 } })` — used for sticker entries, button highlights
- **Fade/slide:** `interpolate(frame, [in, in+15], [0, 1], { extrapolateRight: 'clamp' })` — used for captions, text, images
- **Typing effect:** `Math.floor(interpolate(...))` to slice a string progressively
- **Stagger:** `frame - sceneOffset - (index * 12)` per sticker

---

## Assets

| Asset                             | Used in scene | Purpose                               |
| --------------------------------- | ------------- | ------------------------------------- |
| `real_image.webp`                 | 4             | User's photo sent to ChatGPT          |
| `anime/anime-styled.png`          | 5             | ChatGPT's response grid (placeholder) |
| `disney/disney-styled.png`        | 6             | Grid uploaded to Stikup               |
| `disney/disney-styled_01–12.webp` | 7             | Individual sticker reveal             |

---

## Render Commands

```bash
# Preview in browser studio
npx remotion studio

# Render MP4
npx remotion render HowToVideo out/how-to.mp4

# Convert to GIF (requires ffmpeg)
ffmpeg -i out/how-to.mp4 -vf "fps=15,scale=540:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 out/how-to.gif
```

---

## Brand Reference

- **Brand color (green):** `#10a37f` (ChatGPT-matching green used for the "Open ChatGPT" button, also Stikup's primary CTA color)
- **Logo:** use `../frontend/public/favicon.ico` or recreate the "Stikup" wordmark in Inter/display font
- **Background dark:** `#0a0a0a` or `#111`
- **Text:** white / `#f5f5f5`

---

## Out of Scope

- Real screen recordings
- Audio / voiceover (silent video)
- Backend integration — this is a standalone Remotion project
- Automatic upload to any platform
