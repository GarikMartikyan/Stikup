# Stikup Pivot — No AI Generation, Referral-Only Unlock

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot the frontend from "we generate stickers for $5" to "user generates a 12-sticker grid in ChatGPT, uploads it here, we split & deliver — unlock is referral-only, no payment".

**Architecture:** Seven parallel tracks (A–G) that touch separate file sets; they must be implemented in dependency order — A (shared library) first, then B (new /create page) and C–F (edits to existing pages/components/i18n) in any order, and G (verification) last. The middleware proxy.ts already protects /upload and /result — no changes needed there.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, next-intl 4 (but this project uses its own context-based language-provider, NOT the next-intl `useTranslations` hook — always import `useT` from `@/components/language-provider`), lucide-react icons, TypeScript strict.

## Global Constraints

- Work ONLY in `frontend/src/` (and `frontend/src/i18n/messages/`).
- Never use `useTranslations` from next-intl; always use `useT` from `@/components/language-provider`.
- Translation keys live in `frontend/src/i18n/messages/en.json` and `ru.json`; both files must be kept structurally identical.
- "use client" only on components that use state/effects/events. Server components are the default.
- All fetch calls to the backend go through `/api/*` rewrites, NOT direct backend URLs from the browser.
- POST /api/packs FormData('image') call in upload/page.tsx must remain unchanged.
- Do not add new npm dependencies.
- Verification: `npm run -w frontend typecheck`, `npm run -w frontend lint`, `npm run -w frontend test` must all pass.
- Do not commit — the orchestrator commits after review.

---

## File Map

### New files

| Path                                             | Responsibility                                         |
| ------------------------------------------------ | ------------------------------------------------------ |
| `frontend/src/lib/sticker-styles.ts`             | 8 style definitions + `buildPrompt(styleId)` helper    |
| `frontend/src/app/create/page.tsx`               | New /create route — style picker + prompt box + how-to |
| `frontend/src/components/create/StylePicker.tsx` | 8-card responsive style grid                           |
| `frontend/src/components/create/PromptBox.tsx`   | Read-only prompt display + copy button                 |
| `frontend/src/components/create/HowTo.tsx`       | 4-step illustrated walkthrough                         |

### Modified files

| Path                                                | Change                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `frontend/src/i18n/messages/en.json`                | Add `create` namespace; rewrite pricing/faq/how-it-works/upload/result strings; remove payment copy |
| `frontend/src/i18n/messages/ru.json`                | Mirror en.json structure                                                                            |
| `frontend/src/app/upload/page.tsx`                  | Update text keys; add ?style= reminder                                                              |
| `frontend/src/components/upload/upload-intro.tsx`   | New keys: "Upload your ChatGPT grid"                                                                |
| `frontend/src/components/upload/tips-panel.tsx`     | New keys: grid tips, remove $5 card                                                                 |
| `frontend/src/components/upload/upload-actions.tsx` | Update button label ("Upload grid")                                                                 |
| `frontend/src/components/result/data.ts`            | Remove PRICE_LABEL                                                                                  |
| `frontend/src/components/result/result-header.tsx`  | Remove selfie image; neutral header                                                                 |
| `frontend/src/app/result/[packId]/page.tsx`         | Relabel generating→"splitting & cleaning"; FailedState→/create; remove selfie                       |
| `frontend/src/components/result/pack-actions.tsx`   | handleRegenerate → /create; remove PRICE_LABEL import                                               |
| `frontend/src/components/landing/data.ts`           | Rewrite STEPS (4 steps), FAQS (no payment), remove $5                                               |
| `frontend/src/components/landing/how-it-works.tsx`  | 4 steps (add 4th icon); update step count title                                                     |
| `frontend/src/components/landing/pricing.tsx`       | Replace with free/referral explainer section                                                        |
| `frontend/src/components/landing/hero.tsx`          | CTA → /create; update description badge                                                             |
| `frontend/src/components/landing/final-cta.tsx`     | Remove payment copy; CTA → /create                                                                  |
| `frontend/src/lib/auth/cta-href.ts`                 | `uploadCtaHref` → points to /create                                                                 |
| `frontend/src/app/app/page.tsx`                     | First-time → /create (not /upload)                                                                  |
| `frontend/src/proxy.ts`                             | Add /create to protected routes; remove /success                                                    |

### Deleted files

| Path                                               |
| -------------------------------------------------- |
| `frontend/src/app/subscribe/page.tsx`              |
| `frontend/src/app/subscribe/subscribe-content.tsx` |
| `frontend/src/app/success/page.tsx`                |
| `frontend/src/app/success/success-content.tsx`     |

---

## Task 1: Style Library (`frontend/src/lib/sticker-styles.ts`)

**Files:**

- Create: `frontend/src/lib/sticker-styles.ts`

**Interfaces:**

- Produces: `export type StyleId = "chibi"|"disney3d"|"anime"|"ghibli"|"comic"|"pixel"|"clay"|"popart"`, `export type StickerStyle = {id: StyleId; name: string; tagline: string; styleIntro: string; styleConstraints: string}`, `export const STICKER_STYLES: StickerStyle[]`, `export function buildPrompt(styleId: StyleId): string`

- [ ] **Step 1: Create the file**

```typescript
// frontend/src/lib/sticker-styles.ts

export type StyleId =
  | 'chibi'
  | 'disney3d'
  | 'anime'
  | 'ghibli'
  | 'comic'
  | 'pixel'
  | 'clay'
  | 'popart';

export type StickerStyle = {
  id: StyleId;
  name: string;
  tagline: string;
  styleIntro: string;
  styleConstraints: string;
};

const PROMPT_TEMPLATE = `Create a high-resolution sticker sheet based on the provided character image. {STYLE_INTRO} Match the hairstyle, facial features, and clothing from the reference image, but simplify details to fit the {STYLE_NAME} aesthetic.

Generate exactly 12 stickers — no more, no fewer — laid out in a grid of 4 columns and 3 rows (4 faces per row × 3 rows = 12 faces total). Each sticker shows a distinct facial expression with minimal or no body movement. Focus strictly on facial emotions — avoid exaggerated poses, props, symbols, text, or decorative elements.

Expressions to include: laughing, angry, crying, offended, thinking, sleepy, blowing a kiss, winking, surprised, rejoicing (subtle), confused, confident / sassy.

All stickers must:
- Be arranged in a clean grid of exactly 4 columns and 3 rows — 12 faces total
- Leave a clear band of solid green background between every face, both horizontally and vertically, so no two faces touch or overlap
- Have consistent spacing and alignment, uniform scale and style
- Be shown from head to upper torso (top-to-waist framing)
- Have crisp, sticker-like edges

Background:
- Use a solid #00B140 green background
- No gradients, textures, or shadows

Style constraints:
{STYLE_CONSTRAINTS}
- No text, speech bubbles, emojis, or extra symbols
- Keep expressions clear, readable, and visually distinct`;

export const STICKER_STYLES: StickerStyle[] = [
  {
    id: 'chibi',
    name: 'Chibi',
    tagline: 'Cute & soft',
    styleIntro:
      'Render the character in a cute 2D chibi style with soft, exaggerated proportions (large head, small body), clean rounded linework, and smooth pastel-style shading.',
    styleConstraints:
      '- Strictly 2D (no 3D effects, no realism)\n- Thin white sticker outline around each face',
  },
  {
    id: 'disney3d',
    name: 'Disney 3D',
    tagline: 'Pixar-style 3D',
    styleIntro:
      'Render the character as a polished 3D animated movie character in the style of modern Disney·Pixar films — soft rounded forms, large expressive eyes, warm cinematic lighting, and smooth subsurface-style skin shading.',
    styleConstraints:
      '- Stylized 3D render with soft global illumination (friendly, not photoreal)\n- Clean silhouette suitable for a sticker',
  },
  {
    id: 'anime',
    name: 'Anime',
    tagline: 'Crisp cel-shaded',
    styleIntro:
      'Render the character in a clean modern anime style — crisp cel-shaded coloring, defined linework, expressive large eyes, and vibrant but balanced colors.',
    styleConstraints: '- 2D cel-shaded anime look\n- Sharp clean outlines',
  },
  {
    id: 'ghibli',
    name: 'Ghibli',
    tagline: 'Soft & painterly',
    styleIntro:
      'Render the character in a soft, hand-painted Studio-Ghibli-inspired style — gentle watercolor-like shading, warm earthy palette, soft rounded features, and a calm storybook feel.',
    styleConstraints:
      '- Soft 2D painterly look with gentle outlines\n- Cozy, warm color palette',
  },
  {
    id: 'comic',
    name: 'Comic',
    tagline: 'Bold cartoon',
    styleIntro:
      'Render the character as a bold Western-cartoon / comic character — thick confident outlines, flat bright colors, simple cel shading, and exaggerated readable expressions.',
    styleConstraints:
      '- 2D comic style with bold black outlines\n- Flat, punchy colors',
  },
  {
    id: 'pixel',
    name: 'Pixel',
    tagline: 'Retro 16-bit',
    styleIntro:
      'Render the character as retro 16-bit pixel art — blocky pixels, a limited vibrant palette, and clear pixel-level expression detail, like a classic video-game sprite.',
    styleConstraints:
      '- Pixel-art style with visible square pixels (no smooth anti-aliasing on the character)\n- Limited retro color palette',
  },
  {
    id: 'clay',
    name: 'Clay',
    tagline: 'Claymation',
    styleIntro:
      'Render the character as a cute claymation / plasticine model — soft matte clay texture, rounded handmade forms, gentle sculpt marks, and soft studio lighting.',
    styleConstraints:
      '- Stylized 3D clay look (stop-motion feel)\n- Soft, matte surfaces',
  },
  {
    id: 'popart',
    name: 'Pop Art',
    tagline: 'Bold & vibrant',
    styleIntro:
      'Render the character as bold pop-art — high-contrast flat colors, clean fills, thick outlines, and vibrant comic-poster energy.',
    styleConstraints:
      '- 2D pop-art style with bold saturated colors and strong outlines\n- Keep the character clean (solid green background only, as specified)',
  },
];

export function buildPrompt(styleId: StyleId): string {
  const style = STICKER_STYLES.find((s) => s.id === styleId);
  if (!style) throw new Error(`Unknown styleId: ${styleId}`);
  return PROMPT_TEMPLATE.replace('{STYLE_INTRO}', style.styleIntro)
    .replace('{STYLE_NAME}', style.name)
    .replace('{STYLE_CONSTRAINTS}', style.styleConstraints);
}
```

- [ ] **Step 2: Verify typecheck passes for this file**

```bash
cd /path/to/repo && npm run -w frontend typecheck 2>&1 | head -30
```

Expected: No errors from `sticker-styles.ts`.

---

## Task 2: i18n — Add `create` namespace + rewrite payment-free strings

**Files:**

- Modify: `frontend/src/i18n/messages/en.json`
- Modify: `frontend/src/i18n/messages/ru.json`

**Interfaces:**

- Produces: translation keys `create.*`, updated `landing.*`, `upload.*`, `result.*` — consumed by all subsequent tasks.

- [ ] **Step 1: Update `en.json`**

Apply ALL changes at once. The sections to replace/add are:

**1a. Replace `landing.hero` (update badge + description)**

```json
"hero": {
  "badge": "New · free with ChatGPT",
  "title_prefix": "A sticker pack of",
  "title_highlight": "YOU",
  "title_suffix": "in your Telegram.",
  "cta_authenticated": "Make my stickers",
  "cta_anonymous": "Sign in to start",
  "see_how": "See how it works",
  "description": "Pick a style. Generate in ChatGPT. Upload the grid. We split and deliver 12 stickers straight to your Telegram.",
  "loved_by": "Loved by early testers",
  "selfie_label": "Your selfie",
  "ready": "ready",
  "pack_count": "{count} stickers"
}
```

**1b. Replace `landing.how_it_works`** (4 steps, updated title)

```json
"how_it_works": {
  "eyebrow": "How it works",
  "title": "Four steps.",
  "title_suffix": "No AI subscription needed.",
  "description": "You generate the art in ChatGPT (free tier works). We handle the splitting, cleaning, and Telegram delivery.",
  "step_label": "STEP",
  "steps": {
    "step_01_title": "Pick a style",
    "step_01_body": "Choose from 8 art styles — Chibi, Disney 3D, Anime, Ghibli, and more. We'll build a prompt for you.",
    "step_02_title": "Generate in ChatGPT",
    "step_02_body": "Copy the prompt, open ChatGPT, paste it and attach your photo. ChatGPT returns one image: a 4×3 grid of 12 stickers.",
    "step_03_title": "Upload the grid",
    "step_03_body": "Come back here and upload that single grid image. Our splitter cuts and cleans the 12 stickers automatically.",
    "step_04_title": "Get your pack",
    "step_04_body": "3 stickers are free to grab. Refer one friend who signs up and all 12 unlock — the bot installs the full pack to your Telegram."
  }
}
```

**1c. Replace `landing.pack_showcase`**

```json
"pack_showcase": {
  "eyebrow": "The pack",
  "title": "Here's what you actually get.",
  "description": "Every pack is 12 stickers split from one ChatGPT-generated grid. You see all 12 right away — 3 are free to take, 9 stay locked until you refer a friend.",
  "cta_authenticated": "Try the free preview",
  "cta_anonymous": "Sign in to try free",
  "unlock_authenticated": "Unlock all 12",
  "unlock_anonymous": "Sign in to unlock",
  "stickers_locked": "9 stickers locked",
  "your_pack_ready": "Your pack · ready",
  "bullets": {
    "b1": "12 expressive emotions, hand-curated",
    "b2": "Real Telegram sticker set you own",
    "b3": "Free 3 stickers — no payment required",
    "b4": "Unlock all 12 for free — just refer one friend",
    "b5": "Download WebP or PNG anytime"
  }
}
```

**1d. Replace `landing.features`** (update body copy to remove time/AI references)

```json
"features": {
  "eyebrow": "Why Stikup",
  "title": "Built for the chat,",
  "title_suffix": "not the gallery.",
  "items": {
    "ready_title": "Your style, your way",
    "ready_body": "8 art styles to choose from. Pick the one that fits your vibe and we build the ChatGPT prompt for you.",
    "likeness_title": "Likeness that lands",
    "likeness_body": "Tight prompts + a forgiving cartoon style so people actually recognise you.",
    "telegram_title": "Real Telegram pack",
    "telegram_body": "Created under your Telegram account. Yours forever. Install with one tap.",
    "download_title": "Yours to download",
    "download_body": "Grab the WebPs or PNGs and use them anywhere — TikTok, IG, Discord, you name it."
  }
}
```

**1e. Replace `landing.pricing`** (new free/referral section — keep the key for backward compat with the section id)

```json
"pricing": {
  "eyebrow": "Pricing",
  "title": "It's free.",
  "title_suffix": "Unlock with a referral.",
  "description": "Generate your sticker grid in ChatGPT, upload it here, and get 3 stickers free. Refer one friend who signs up and all 12 unlock — no payment ever.",
  "how_label": "How it works",
  "step_chatgpt": "Generate your 4×3 sticker grid in ChatGPT using the prompt we build",
  "step_upload": "Upload the grid — we split and clean all 12 stickers",
  "step_free": "Take 3 stickers for free, instantly",
  "step_refer": "Refer a friend who signs up → all 12 unlock free",
  "cta_authenticated": "Start creating",
  "cta_anonymous": "Sign in to start",
  "referral_note": "No credit card. No subscription. Ever."
}
```

**1f. Replace `landing.faq`**

```json
"faq": {
  "eyebrow": "FAQ",
  "title": "Questions, answered.",
  "items": {
    "q1": "How does it actually work?",
    "a1": "You choose an art style, copy a ready-made prompt, open ChatGPT and paste the prompt with your photo. ChatGPT returns one image — a 4×3 grid of 12 stickers. You upload that grid here; we split, clean, and deliver the stickers to your Telegram.",
    "q2": "Do I need a paid ChatGPT subscription?",
    "a2": "ChatGPT's free tier can generate images. If you hit a generation limit you may need ChatGPT Plus, but that's a separate service — Stikup itself is always free.",
    "q3": "How do I unlock all 12 stickers?",
    "a3": "Refer one friend who signs up to Stikup. Once they register, all 12 of your stickers unlock automatically — no payment, no subscription.",
    "q4": "What about my photo?",
    "a4": "Your uploaded grid image is stored only while your account exists. Delete your account from Settings and everything is removed. GDPR-ready from day one.",
    "q5": "Why are 9 stickers locked instead of just hidden?",
    "a5": "So you can see exactly what you'd be unlocking. The locked previews are the real split stickers — visible, with a small lock badge on top. A referral flips the badge off and installs all 12 to your Telegram."
  }
}
```

**1g. Replace `landing.final_cta`**

```json
"final_cta": {
  "title_line1": "Your face.",
  "title_line2": "Your pack.",
  "title_line3": "Free.",
  "description": "Pick a style, generate in ChatGPT, upload the grid. Your sticker pack is ready in minutes.",
  "cta_authenticated": "Start creating",
  "cta_anonymous": "Sign in to start",
  "open_bot": "Open Telegram bot",
  "ready": "Free to use",
  "age_gdpr": "13+ only · GDPR ready",
  "download": "Download PNG / WebP"
}
```

**1h. Replace `upload.*`**

```json
"upload": {
  "intro": {
    "step": "Step 02 of 03",
    "title": "Upload your ChatGPT grid.",
    "description": "Paste the 4×3 grid image ChatGPT generated — we'll split and clean all 12 stickers automatically."
  },
  "drop_zone": {
    "upload_aria": "Upload the sticker grid",
    "title": "Drop the grid image or tap to pick",
    "formats": "JPEG · PNG · up to 8 MB",
    "hint_drag": "Drag & drop",
    "hint_paste": "Paste",
    "hint_camera": "Open files",
    "selfie_preview_alt": "Your grid preview",
    "remove_photo": "Remove image",
    "looks_good": "Looks good"
  },
  "actions": {
    "pick_from_device": "Pick from device",
    "use_camera": "Use camera",
    "generate": "Upload grid",
    "sending": "Splitting stickers…",
    "choose_another": "Choose another",
    "back": "Back"
  },
  "tips": {
    "section_label": "Grid requirements",
    "tip_face": "Must be the 4×3 grid ChatGPT gave you",
    "tip_light": "Solid green background (#00B140)",
    "tip_camera": "All 12 stickers visible, none cropped",
    "free_preview_label": "What you get",
    "free_preview_title": "3 stickers free. Unlock 9 more with a referral.",
    "free_preview_body": "Upload the grid and we split all 12. Take 3 free — share your referral link with one friend who signs up and the full pack unlocks for free.",
    "privacy_note": "We never share or sell your image. It's stored only while your account exists and removed instantly when you delete it."
  },
  "error": {
    "photo_not_accepted": "Image not accepted",
    "invalid_format": "Use a JPEG or PNG image.",
    "too_large": "File is over 8 MB. Try a smaller export.",
    "generation_failed": "Upload failed. Make sure you upload the clean 4×3 grid ChatGPT made (green background). Please try again.",
    "no_generations": "You've used all your generations."
  }
}
```

**1i. Replace `result.*`**

```json
"result": {
  "generating": {
    "title": "Splitting & cleaning your stickers…",
    "description": "We're cutting the grid into 12 stickers and removing the green background. Hang tight!",
    "label": "Processing sticker grid"
  },
  "failed": {
    "title": "Couldn't split that grid",
    "description": "Make sure you upload the clean 4×3 grid ChatGPT made (green background, all 12 faces visible, nothing cropped).",
    "retry": "Try another grid"
  },
  "header": {
    "eyebrow": "Pack ready",
    "title": "Your sticker pack is alive.",
    "description": "All 12 split. 3 free, 9 unlock with a referral.",
    "selfie_alt": "Your sticker pack"
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
    "regenerate": "Try another style",
    "take_free": "Take {count} free",
    "install_telegram": "Install to Telegram",
    "sending_telegram": "Sending to Telegram…",
    "regen_left": "1 free retry left",
    "recommended": "Recommended",
    "link_copied": "Link copied!",
    "copying_link": "Copying link…",
    "no_regens": "No retries left",
    "claimed": "You've got this pack"
  },
  "get_stickers_modal": {
    "title": "Get your stickers",
    "get_in_telegram": "Get in Telegram",
    "get_in_telegram_desc": "The bot will install the pack straight into your Telegram.",
    "pack_ready": "Your pack is ready!",
    "open_pack": "Open your pack in Telegram",
    "download": "Download",
    "downloading": "Downloading…",
    "download_desc": "Save each sticker as a .webp file to your device.",
    "connect_telegram_prompt": "Connect your Telegram account in Settings to receive stickers via bot.",
    "go_to_settings": "Go to Settings",
    "close": "Close"
  }
}
```

**1j. Replace `dashboard.pack_list.make_another_body`** (remove $5 reference)

```json
"make_another_body": "Pick a new style, generate in ChatGPT, and upload a fresh grid."
```

**1k. Replace `dashboard.stats.subscription_hint`**

```json
"subscription_hint": "free — referral unlock"
```

**1l. Replace `pages.subscribe`** (page will be deleted but keep key for safety)

```json
"subscribe": {
  "eyebrow": "Subscription",
  "badge": "Not available",
  "title": "No subscriptions",
  "body": "Stikup is free. Upload a ChatGPT grid, get 3 stickers free, and unlock all 12 by referring a friend.",
  "note": "No payment needed."
}
```

**1m. Remove the entire `success` block** — the route is being deleted. (Remove the `"success": { ... }` key entirely from the JSON.)

**1n. Add `create` namespace**

```json
"create": {
  "eyebrow": "Step 01 of 03",
  "title": "Pick your style.",
  "description": "Choose an art style and we'll build the ChatGPT prompt for you.",
  "style_picker_label": "Art styles",
  "prompt_label": "Your ChatGPT prompt",
  "copy_prompt": "Copy prompt",
  "copied": "Copied!",
  "open_chatgpt": "Open ChatGPT",
  "continue": "I have my grid → Continue",
  "style_reminder": "Style: {name}",
  "how_to": {
    "title": "How to generate your sticker grid",
    "step1_title": "Copy this prompt",
    "step1_body": "The prompt above is customised for your chosen style. Copy it with the button.",
    "step2_title": "Open ChatGPT & paste",
    "step2_body": "Open ChatGPT (free tier works), paste the prompt, and attach your photo.",
    "step3_title": "Get the grid image",
    "step3_body": "ChatGPT returns one image — a 4×3 grid of 12 stickers on a green background. Save it.",
    "step4_title": "Upload the grid here",
    "step4_body": "Come back and tap \"I have my grid\" to upload. We split and clean all 12 stickers."
  }
}
```

- [ ] **Step 2: Mirror changes in `ru.json`**

Apply the same structural changes to `ru.json`. For the new/changed values, use the Russian translations below (leave a `// TODO: professional translation` comment inside a dedicated `_todo` key is NOT valid JSON — just provide the best effort Russian):

Key Russian translations:

- `create.title` → "Выберите стиль."
- `create.description` → "Выберите арт-стиль, и мы составим промпт для ChatGPT."
- `create.copy_prompt` → "Копировать промпт"
- `create.copied` → "Скопировано!"
- `create.open_chatgpt` → "Открыть ChatGPT"
- `create.continue` → "Сетка готова → Продолжить"
- `create.how_to.title` → "Как сгенерировать стикеры"
- `create.how_to.step1_title` → "Скопируйте промпт"
- `create.how_to.step1_body` → "Промпт выше настроен под ваш стиль. Нажмите кнопку, чтобы скопировать."
- `create.how_to.step2_title` → "Откройте ChatGPT и вставьте"
- `create.how_to.step2_body` → "Откройте ChatGPT (бесплатная версия подойдёт), вставьте промпт и прикрепите фото."
- `create.how_to.step3_title` → "Сохраните изображение"
- `create.how_to.step3_body` → "ChatGPT вернёт одно изображение — сетку 4×3 из 12 стикеров на зелёном фоне. Сохраните его."
- `create.how_to.step4_title` → "Загрузите сетку сюда"
- `create.how_to.step4_body` → "Вернитесь и нажмите «Сетка готова». Мы разрежем и обработаем все 12 стикеров."
- `upload.intro.title` → "Загрузите сетку из ChatGPT."
- `upload.intro.description` → "Загрузите изображение-сетку 4×3, которое сгенерировал ChatGPT — мы автоматически разрежем 12 стикеров."
- `upload.actions.generate` → "Загрузить сетку"
- `upload.actions.sending` → "Разрезаем стикеры…"
- `upload.tips.free_preview_title` → "3 стикера бесплатно. 9 — по рефералу."
- `result.generating.title` → "Разрезаем и очищаем стикеры…"
- `result.failed.title` → "Не удалось разрезать сетку"
- `result.failed.description` → "Убедитесь, что вы загрузили чистую сетку 4×3 из ChatGPT (зелёный фон, все 12 лиц видны)."
- `result.failed.retry` → "Попробовать другую сетку"
- `landing.pricing.title` → "Это бесплатно."
- `landing.how_it_works.title` → "Четыре шага."

All other landing/faq/result keys in ru.json that aren't listed above: mirror the English text as a placeholder (professional translation can follow).

- [ ] **Step 3: Validate JSON syntax**

```bash
node -e "JSON.parse(require('fs').readFileSync('frontend/src/i18n/messages/en.json','utf8')); console.log('en OK')"
node -e "JSON.parse(require('fs').readFileSync('frontend/src/i18n/messages/ru.json','utf8')); console.log('ru OK')"
```

Expected: both print OK.

---

## Task 3: New `/create` page components

**Files:**

- Create: `frontend/src/components/create/StylePicker.tsx`
- Create: `frontend/src/components/create/PromptBox.tsx`
- Create: `frontend/src/components/create/HowTo.tsx`
- Create: `frontend/src/app/create/page.tsx`

**Interfaces:**

- Consumes: `STICKER_STYLES`, `buildPrompt`, `StyleId` from `@/lib/sticker-styles` (Task 1); i18n `create.*` keys (Task 2)
- Produces: `/create` route accessible from browser

- [ ] **Step 1: Create `StylePicker.tsx`**

```typescript
// frontend/src/components/create/StylePicker.tsx
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
const STYLE_ICONS: Record<StyleId, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
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
```

- [ ] **Step 2: Create `PromptBox.tsx`**

```typescript
// frontend/src/components/create/PromptBox.tsx
"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "@/components/language-provider";

type PromptBoxProps = {
  prompt: string;
};

export function PromptBox({ prompt }: PromptBoxProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may not be available in non-secure contexts; no-op.
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          {t("create.prompt_label")}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
            copied
              ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
              : "bg-[var(--color-brand)]/10 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/20"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" strokeWidth={3} />
              {t("create.copied")}
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" strokeWidth={2.5} />
              {t("create.copy_prompt")}
            </>
          )}
        </button>
      </div>
      <textarea
        readOnly
        value={prompt}
        rows={10}
        className="w-full resize-none rounded-b-2xl bg-transparent px-4 py-3 font-mono text-xs text-[var(--color-fg-muted)] focus:outline-none"
        aria-label={t("create.prompt_label")}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create `HowTo.tsx`**

```typescript
// frontend/src/components/create/HowTo.tsx
"use client";

import { ClipboardCopy, ExternalLink, Grid2X2, Upload } from "lucide-react";
import { useT } from "@/components/language-provider";

// TODO: Replace these icon mockups with real screenshots when available.
// Each step card has a fixed-height area above the text where you can drop
// a <Image src="/assets/how-to/step-N.webp" ... /> component.

const STEP_ICONS = [ClipboardCopy, ExternalLink, Grid2X2, Upload];

export function HowTo() {
  const t = useT();

  const steps = [
    {
      icon: STEP_ICONS[0],
      title: t("create.how_to.step1_title"),
      body: t("create.how_to.step1_body"),
    },
    {
      icon: STEP_ICONS[1],
      title: t("create.how_to.step2_title"),
      body: t("create.how_to.step2_body"),
    },
    {
      icon: STEP_ICONS[2],
      title: t("create.how_to.step3_title"),
      body: t("create.how_to.step3_body"),
    },
    {
      icon: STEP_ICONS[3],
      title: t("create.how_to.step4_title"),
      body: t("create.how_to.step4_body"),
    },
  ];

  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        {t("create.how_to.title")}
      </h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li
              key={i}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
            >
              {/* TODO: drop a <Image> screenshot here once available */}
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-brand)]/12 text-[var(--color-brand)]">
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--color-fg-subtle)]">
                0{i + 1}
              </div>
              <div className="font-semibold text-sm text-[var(--color-fg)]">
                {step.title}
              </div>
              <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">
                {step.body}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/app/create/page.tsx`**

```typescript
// frontend/src/app/create/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { StylePicker } from "@/components/create/StylePicker";
import { PromptBox } from "@/components/create/PromptBox";
import { HowTo } from "@/components/create/HowTo";
import {
  buildPrompt,
  STICKER_STYLES,
  type StyleId,
} from "@/lib/sticker-styles";
import { useT } from "@/components/language-provider";

export default function CreatePage() {
  const t = useT();
  const [selectedStyle, setSelectedStyle] = useState<StyleId>(
    STICKER_STYLES[0].id,
  );
  const prompt = buildPrompt(selectedStyle);
  const styleName = STICKER_STYLES.find((s) => s.id === selectedStyle)?.name ?? "";

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-6 md:py-10">
        {/* Header */}
        <div className="reveal max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            {t("create.eyebrow")}
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
            {t("create.title")}
          </h1>
          <p className="mt-2 text-base text-[var(--color-fg-muted)] md:text-lg">
            {t("create.description")}
          </p>
        </div>

        {/* Style picker */}
        <div className="reveal mt-8" style={{ animationDelay: "80ms" }}>
          <StylePicker selected={selectedStyle} onSelect={setSelectedStyle} />
        </div>

        {/* Prompt box */}
        <div className="reveal mt-6" style={{ animationDelay: "150ms" }}>
          <PromptBox prompt={prompt} />
        </div>

        {/* ChatGPT link + Continue */}
        <div
          className="reveal mt-5 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "200ms" }}
        >
          <a
            href="https://chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-5 py-3 text-sm font-semibold text-[var(--color-fg)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={2.2} />
            {t("create.open_chatgpt")}
          </a>
          <Link
            href={`/upload?style=${encodeURIComponent(selectedStyle)}`}
            className="shimmer group inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
          >
            {t("create.continue")}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>

        {/* How-to walkthrough */}
        <div className="reveal mt-8" style={{ animationDelay: "250ms" }}>
          <HowTo />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Add /create to proxy.ts protected routes**

In `frontend/src/proxy.ts`, find the `matcher` config (the protected routes array) and add `/create` and `/create/:path*` to it. Also remove `/success` and `/success/:path*` since that page is being deleted.

Look for the `export const config` block or wherever the protected route patterns are defined, and update accordingly. Be careful — the file is middleware so read it first.

- [ ] **Step 6: Run typecheck**

```bash
cd /path/to/repo && npm run -w frontend typecheck 2>&1 | grep -E "error|Error" | head -20
```

Expected: 0 errors from the new files.

---

## Task 4: Update `/upload` page

**Files:**

- Modify: `frontend/src/components/upload/upload-intro.tsx` (keys already updated in Task 2; no code change needed)
- Modify: `frontend/src/components/upload/tips-panel.tsx` (remove $5 pricing card)
- Modify: `frontend/src/components/upload/upload-actions.tsx` (update button labels — already done via i18n keys)
- Modify: `frontend/src/app/upload/page.tsx` (read ?style= param, show style reminder; update error handling copy key)

**Interfaces:**

- Consumes: new `upload.*` i18n keys (Task 2); `?style=` query param
- Produces: /upload renders new copy; shows style reminder when ?style= present

- [ ] **Step 1: Update `tips-panel.tsx` — remove $5 card, add grid tip**

Replace the entire pricing card (the `div` with `overflow-hidden rounded-3xl border ... bg-gradient-to-br`) with the new content using the new i18n keys. The `section_label` still says "Grid requirements" and the 3 tips now map to `tip_face`, `tip_light`, `tip_camera`.

The "free preview" card changes from "$5" copy to referral copy but keeps the same visual design:

```typescript
// In the TipsPanel function, the second card (was "Free preview") becomes:
<div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-brand)]/10 via-[var(--color-bg-elev)] to-[var(--color-brand-2)]/10 p-6">
  <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
    {t("upload.tips.free_preview_label")}
  </div>
  <div className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
    {t("upload.tips.free_preview_title")}
  </div>
  <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
    {t("upload.tips.free_preview_body")}
  </p>
</div>
```

(The i18n values were updated in Task 2 to say "3 stickers free. Unlock 9 more with a referral.")

- [ ] **Step 2: Update `upload/page.tsx` — read ?style= and show reminder**

Add `useSearchParams` to read the `style` param. Import `STICKER_STYLES` from `@/lib/sticker-styles`. Show a small style reminder chip above `<UploadIntro />` when the param is present.

```typescript
// Add near the top of the component (after other imports):
import { useSearchParams } from "next/navigation";
import { STICKER_STYLES } from "@/lib/sticker-styles";

// Inside UploadPage():
const searchParams = useSearchParams();
const styleId = searchParams.get("style");
const styleName = styleId
  ? (STICKER_STYLES.find((s) => s.id === styleId)?.name ?? null)
  : null;

// In the JSX, above <UploadIntro />:
{styleName && (
  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
    {t("create.style_reminder", { name: styleName })}
  </div>
)}
```

Note: `useSearchParams` requires the component to remain `"use client"` — it already is.

- [ ] **Step 3: Update `upload/page.tsx` — fix error key for failed upload**

The `generation_failed` i18n key is now "Upload failed. Make sure you upload the clean 4×3 grid ChatGPT made (green background). Please try again." — no code change needed since the key is unchanged; the value was updated in Task 2.

Also update the camera input label — grid images don't need camera capture. Change `capture="user"` to just a regular file input (remove the `capture` attribute) OR keep it for mobile users who might want to use it. Decision: remove the camera-specific button on upload (it's a grid from ChatGPT, not a camera shot). Update `UploadActions` to show only "Pick from device" (not "Use camera") on mobile. Simply remove the camera button from the idle state:

In `upload-actions.tsx`, the idle state currently renders two buttons (gallery + camera). Change the mobile-idle state to only show gallery:

```typescript
// In UploadActions, idle state (fileReady === false):
// REMOVE the camera button entirely.
// The div becomes:
<div className="mt-5 flex flex-col gap-3 md:hidden">
  <button
    type="button"
    onClick={onPickGallery}
    className="shimmer group inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-4 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition active:translate-y-0.5"
  >
    <ImageIcon className="h-5 w-5" /> {t("upload.actions.pick_from_device")}
  </button>
</div>
```

Also remove `onPickCamera` from `UploadActionsProps` and its usage in `upload/page.tsx` (and the hidden `cameraRef` input). Actually — keep the `onPickCamera` prop optional or just leave it — simpler to just hide the button visually. Decision: remove the Camera button from the idle state only; keep the `onPickCamera` prop as optional for now. Update `UploadActionsProps`:

```typescript
type UploadActionsProps = {
  fileReady: boolean;
  submitting: boolean;
  onPickGallery: () => void;
  onPickCamera?: () => void; // optional — no longer shown on upload page
  onSubmit: () => void;
};
```

- [ ] **Step 4: Run typecheck**

```bash
npm run -w frontend typecheck 2>&1 | grep "error" | head -10
```

Expected: 0 errors.

---

## Task 5: Update `/result/[packId]` page + result components

**Files:**

- Modify: `frontend/src/components/result/data.ts` (remove PRICE_LABEL)
- Modify: `frontend/src/components/result/result-header.tsx` (neutral header, no selfie image)
- Modify: `frontend/src/app/result/[packId]/page.tsx` (update generating label; failed → /create; remove headerSelfieUrl)
- Modify: `frontend/src/components/result/pack-actions.tsx` (handleRegenerate → /create)

**Interfaces:**

- Consumes: new `result.*` i18n keys (Task 2)

- [ ] **Step 1: Remove `PRICE_LABEL` from `data.ts`**

```typescript
// frontend/src/components/result/data.ts
export const ALL_STICKERS = Array.from({ length: 12 }, (_, i) => ({
  src: `/assets/sticker_${i + 1}.webp`,
  alt: `Sticker ${i + 1}`,
}));

export const FREE_COUNT = 3;
export const PACK_SIZE = 12;
// PRICE_LABEL removed — app is free, unlock via referral
```

- [ ] **Step 2: Update `result-header.tsx` — no selfie, neutral header**

Remove the `Image` import and the selfie thumbnail. Replace the component with a neutral text-only header (no photo, no STOCK_SRC):

```typescript
// frontend/src/components/result/result-header.tsx
"use client";

import { useT } from "@/components/language-provider";

export function ResultHeader() {
  const t = useT();

  return (
    <div className="reveal flex flex-wrap items-center gap-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
          {t("result.header.eyebrow")}
        </div>
        <h1 className="mt-0.5 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-[-0.02em] md:text-4xl">
          {t("result.header.title")}
        </h1>
        <p className="mt-0.5 text-sm text-[var(--color-fg-muted)] md:text-base">
          {t("result.header.description")}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `result/[packId]/page.tsx`**

Three changes:

1. Remove `selfieUrl` from the `Pack` type and `parsePack` — keep `selfieUrl` field removed.
2. Remove `headerSelfieUrl` derivation.
3. Update `<ResultHeader />` call — no prop needed.
4. Update `GeneratingState` — remove selfie image, use a neutral spinner card.
5. Update `FailedState` — link to `/create` instead of `/upload`.
6. Update `GeneratingState` `aria-label` to use new key `result.generating.label`.

For `GeneratingState`, replace the user photo with a plain spinner:

```typescript
function GeneratingState() {
  const t = useT();

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-12 shadow-[var(--shadow-card)]"
      aria-label={t("result.generating.label")}
      role="status"
    >
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-[var(--color-brand)]/30 border-t-[var(--color-brand)]" />
        <p className="font-semibold text-[var(--color-fg)]">
          {t("result.generating.title")}
        </p>
      </div>
      <p className="-mt-2 text-center text-sm text-[var(--color-fg-muted)]">
        {t("result.generating.description")}
      </p>
    </div>
  );
}
```

For `FailedState`, change the retry button href from `/upload` to `/create`:

```typescript
<Link
  href="/create"
  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-5 py-2 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
>
  <RefreshCw className="h-4 w-4" strokeWidth={2.2} />
  {t("result.failed.retry")}
</Link>
```

Remove the `selfieUrl` field from the `Pack` type, `PageState`, `buildDemoPack`, and `parsePack`. Remove `STOCK_SRC` constant and any `Image` import used only for selfie. Remove `headerSelfieUrl` variable. Change `<ResultHeader selfieUrl={headerSelfieUrl} />` to just `<ResultHeader />`. Change the `GeneratingState` call from `<GeneratingState selfieUrl={state.selfieUrl} />` to just `<GeneratingState />`. Remove the `selfieUrl` field from the `generating` page state variant.

Updated `PageState`:

```typescript
type PageState =
  | { kind: 'loading' }
  | { kind: 'generating' }
  | { kind: 'ready'; pack: Pack }
  | { kind: 'failed' }
  | { kind: 'demo'; pack: Pack };
```

Updated `Pack`:

```typescript
type Pack = {
  id: string;
  status: 'generating' | 'ready' | 'failed';
  unlocked: boolean;
  locked: boolean;
  freeCount: number;
  packSize: number;
  stickers: StickerItem[];
  regensLeft: number;
};
```

Update `parsePack` to remove `selfieUrl`. Update the poll `if (data.status === "generating")` branch:

```typescript
if (data.status === 'generating') {
  setState({ kind: 'generating' });
  timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
  return;
}
```

Remove `selfieUrl` from the JSON shape type in the poll response.

- [ ] **Step 4: Update `pack-actions.tsx` — handleRegenerate → /create**

Change `router.push("/upload")` to `router.push("/create")` in `handleRegenerate`.

- [ ] **Step 5: Check `pricing.tsx` for PRICE_LABEL import**

`frontend/src/components/landing/pricing.tsx` imports `PRICE_LABEL` from `@/components/result/data`. Since we're replacing the entire pricing section in Task 6, the import will be removed there. For now, just ensure `data.ts` doesn't export it — which we did in Step 1. Confirm pricing.tsx is being rewritten in Task 6 before merging.

- [ ] **Step 6: Run typecheck**

```bash
npm run -w frontend typecheck 2>&1 | grep "error" | head -20
```

Expected: 0 errors.

---

## Task 6: Delete subscribe/success routes and update landing

**Files:**

- Delete: `frontend/src/app/subscribe/page.tsx`
- Delete: `frontend/src/app/subscribe/subscribe-content.tsx`
- Delete: `frontend/src/app/success/page.tsx`
- Delete: `frontend/src/app/success/success-content.tsx`
- Modify: `frontend/src/components/landing/pricing.tsx`
- Modify: `frontend/src/components/landing/how-it-works.tsx`
- Modify: `frontend/src/components/landing/hero.tsx`
- Modify: `frontend/src/components/landing/final-cta.tsx`
- Modify: `frontend/src/components/landing/data.ts`
- Modify: `frontend/src/lib/auth/cta-href.ts`
- Modify: `frontend/src/app/app/page.tsx`
- Modify: `frontend/src/lib/nav-links.ts` (remove "pricing" link)
- Modify: `frontend/src/proxy.ts` (remove /success from protected; add /create)

**Interfaces:**

- Consumes: new `landing.*` i18n keys (Task 2); `/create` route (Task 3)

- [ ] **Step 1: Delete the subscribe and success route files**

```bash
rm frontend/src/app/subscribe/page.tsx
rm frontend/src/app/subscribe/subscribe-content.tsx
rm frontend/src/app/success/page.tsx
rm frontend/src/app/success/success-content.tsx
rmdir frontend/src/app/subscribe 2>/dev/null || true
rmdir frontend/src/app/success 2>/dev/null || true
```

- [ ] **Step 2: Rewrite `pricing.tsx` — free/referral explainer**

Remove the `PRICE_LABEL` import and the entire dollar-amount card. Replace with a "It's free" section with a step list:

```typescript
// frontend/src/components/landing/pricing.tsx
"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useT } from "@/components/language-provider";
import { uploadCtaHref } from "@/lib/auth/cta-href";

export function Pricing({ loggedIn }: { loggedIn: boolean }) {
  const t = useT();

  const steps = [
    t("landing.pricing.step_chatgpt"),
    t("landing.pricing.step_upload"),
    t("landing.pricing.step_free"),
    t("landing.pricing.step_refer"),
  ];

  return (
    <section id="pricing" className="snap-section relative flex min-h-dvh flex-col justify-center py-16 md:py-20">
      <div className="mx-auto w-full max-w-3xl px-5 text-center">
        <div className="reveal">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            {t("landing.pricing.eyebrow")}
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
            {t("landing.pricing.title")}
            <br />
            <span className="text-[var(--color-fg-muted)]">{t("landing.pricing.title_suffix")}</span>
          </h2>
          <p className="mt-5 text-lg text-[var(--color-fg-muted)]">
            {t("landing.pricing.description")}
          </p>
        </div>

        <div className="reveal relative mt-12" style={{ animationDelay: "150ms" }}>
          <div
            className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] opacity-60 blur-xl"
            style={{
              backgroundSize: "300% 300%",
              animation: "gradient-shift 7s ease-in-out infinite",
            }}
          />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-8 text-left shadow-[var(--shadow-card)] md:p-10">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-success)]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-success)]">
                {t("landing.pricing.how_label")}
              </div>
            </div>

            <ol className="space-y-4">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-brand)]/15 text-xs font-bold text-[var(--color-brand)]">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[var(--color-fg)]">{step}</span>
                </li>
              ))}
            </ol>

            <div className="my-7 hr-dotted" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-[var(--color-fg-muted)]">
                {t("landing.pricing.referral_note")}
              </p>
              <Link
                href={uploadCtaHref(loggedIn)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3.5 text-base font-bold text-white transition hover:opacity-90"
              >
                {loggedIn ? t("landing.pricing.cta_authenticated") : t("landing.pricing.cta_anonymous")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update `how-it-works.tsx` — 4 steps**

Import `UploadCloud` (or suitable 4th icon) as the 4th step icon. Add the 4th step. Update title from "Three steps." to use i18n key `landing.how_it_works.title` (now "Four steps.").

```typescript
// frontend/src/components/landing/how-it-works.tsx
"use client";

import { Gift, MessageCircle, Upload, UploadCloud } from "lucide-react";
import { useT } from "@/components/language-provider";

const STEP_ICONS = [MessageCircle, UploadCloud, Upload, Gift];
const STEP_EYEBROWS = ["01", "02", "03", "04"];

export function HowItWorks() {
  const t = useT();

  const steps = [
    {
      icon: STEP_ICONS[0],
      eyebrow: STEP_EYEBROWS[0],
      title: t("landing.how_it_works.steps.step_01_title"),
      body: t("landing.how_it_works.steps.step_01_body"),
    },
    {
      icon: STEP_ICONS[1],
      eyebrow: STEP_EYEBROWS[1],
      title: t("landing.how_it_works.steps.step_02_title"),
      body: t("landing.how_it_works.steps.step_02_body"),
    },
    {
      icon: STEP_ICONS[2],
      eyebrow: STEP_EYEBROWS[2],
      title: t("landing.how_it_works.steps.step_03_title"),
      body: t("landing.how_it_works.steps.step_03_body"),
    },
    {
      icon: STEP_ICONS[3],
      eyebrow: STEP_EYEBROWS[3],
      title: t("landing.how_it_works.steps.step_04_title"),
      body: t("landing.how_it_works.steps.step_04_body"),
    },
  ];

  return (
    <section id="how" className="snap-section relative flex min-h-dvh flex-col justify-center py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="reveal max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            {t("landing.how_it_works.eyebrow")}
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
            {t("landing.how_it_works.title")}
            <br />
            <span className="text-[var(--color-fg-muted)]">{t("landing.how_it_works.title_suffix")}</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg text-[var(--color-fg-muted)]">
            {t("landing.how_it_works.description")}
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.eyebrow}
              className="reveal group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-7 transition hover:-translate-y-2 hover:border-[var(--color-border-strong)]"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-[var(--color-brand)]/25 to-[var(--color-brand-2)]/20 opacity-70 blur-2xl transition group-hover:opacity-90" />
              <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-lg">
                <step.icon className="h-7 w-7" strokeWidth={2} />
              </div>
              <div className="mt-6 font-mono text-xs font-bold tracking-[0.2em] text-[var(--color-fg-subtle)]">
                {t("landing.how_it_works.step_label")} {step.eyebrow}
              </div>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-[var(--color-fg-muted)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Update `hero.tsx` — CTA → /create**

The hero CTA currently calls `uploadCtaHref(loggedIn)` which returns `/upload` or `/login?next=%2Fupload`. After Task 7, `uploadCtaHref` will return `/create`. No code change needed in `hero.tsx` — the function call stays the same.

- [ ] **Step 5: Update `final-cta.tsx` — remove payment copy, CTA → /create**

Read `frontend/src/components/landing/final-cta.tsx` then replace:

- Any payment/price copy with the new i18n keys (`cta_authenticated` now = "Start creating")
- The CTA should use `uploadCtaHref(loggedIn)` (will point to /create after Task 7)
- The "Ready in 3 minutes" badge should now show `t("landing.final_cta.ready")` = "Free to use"

- [ ] **Step 6: Update `landing/data.ts` — rewrite STEPS and FAQS**

```typescript
// frontend/src/components/landing/data.ts
import {
  Download,
  Gift,
  Heart,
  MessageCircle,
  Palette,
  Send,
  Upload,
  UploadCloud,
} from 'lucide-react';
import type { ComponentType } from 'react';

export type StickerAsset = { src: string; alt: string };

export const ALL_STICKERS: StickerAsset[] = Array.from(
  { length: 12 },
  (_, i) => ({
    src: `/assets/sticker_${i + 1}.webp`,
    alt: `Sticker ${i + 1}`,
  }),
);

export const HERO_STICKERS = [
  { idx: 0, r: -8, t: '5%', l: '0%', d: 0 },
  { idx: 1, r: 6, t: '0%', l: '55%', d: 120 },
  { idx: 2, r: -4, t: '32%', l: '75%', d: 240 },
  { idx: 3, r: 8, t: '60%', l: '62%', d: 360 },
  { idx: 4, r: -10, t: '70%', l: '10%', d: 480 },
  { idx: 5, r: 4, t: '38%', l: '-2%', d: 600 },
] as const;

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

export const STEPS: {
  icon: IconType;
  eyebrow: string;
  title: string;
  body: string;
}[] = [
  {
    icon: Palette,
    eyebrow: '01',
    title: 'Pick a style',
    body: 'Choose from 8 art styles — Chibi, Disney 3D, Anime, Ghibli, and more. We build the ChatGPT prompt for you.',
  },
  {
    icon: UploadCloud,
    eyebrow: '02',
    title: 'Generate in ChatGPT',
    body: 'Paste the prompt and your photo into ChatGPT. It returns one image — a 4×3 grid of 12 stickers on a green background.',
  },
  {
    icon: Upload,
    eyebrow: '03',
    title: 'Upload the grid',
    body: 'Come back and upload the grid image. Our splitter cuts and cleans all 12 stickers automatically.',
  },
  {
    icon: Gift,
    eyebrow: '04',
    title: 'Get your pack',
    body: '3 stickers are free. Refer one friend who signs up and all 12 unlock — the bot installs your full pack to Telegram.',
  },
];

export const FEATURES: { icon: IconType; title: string; body: string }[] = [
  {
    icon: Palette,
    title: '8 art styles',
    body: 'Chibi, Disney 3D, Anime, Ghibli, Comic, Pixel, Clay, Pop Art. Pick the one that fits your vibe.',
  },
  {
    icon: Heart,
    title: 'Likeness that lands',
    body: 'Tight prompts + a forgiving cartoon style so people actually recognise you.',
  },
  {
    icon: Send,
    title: 'Real Telegram pack',
    body: 'Created under your Telegram account. Yours forever. Install with one tap.',
  },
  {
    icon: Download,
    title: 'Yours to download',
    body: 'Grab the WebPs or PNGs and use them anywhere — TikTok, IG, Discord, you name it.',
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'How does it actually work?',
    a: 'You choose an art style, copy a ready-made prompt, open ChatGPT and paste the prompt with your photo. ChatGPT returns one image — a 4×3 grid of 12 stickers. You upload that grid here; we split, clean, and deliver the stickers to your Telegram.',
  },
  {
    q: 'Do I need a paid ChatGPT subscription?',
    a: "ChatGPT's free tier can generate images. If you hit a generation limit you may need ChatGPT Plus, but that's a separate service — Stikup itself is always free.",
  },
  {
    q: 'How do I unlock all 12 stickers?',
    a: 'Refer one friend who signs up to Stikup. Once they register, all 12 of your stickers unlock automatically — no payment, no subscription.',
  },
  {
    q: 'What about my photo?',
    a: 'Your uploaded grid image is stored only while your account exists. Delete your account from Settings and everything is removed. GDPR-ready from day one.',
  },
  {
    q: 'Why are 9 stickers locked instead of just hidden?',
    a: "So you can see exactly what you'd be unlocking. The locked previews are the real split stickers — visible, with a small lock badge on top. A referral flips the badge off and installs all 12 to your Telegram.",
  },
];
```

- [ ] **Step 7: Update `cta-href.ts` → /create**

```typescript
// frontend/src/lib/auth/cta-href.ts
export function uploadCtaHref(loggedIn: boolean): string {
  return loggedIn ? '/create' : '/login?next=%2Fcreate';
}
```

- [ ] **Step 8: Update `app/page.tsx` smart-home routing → /create**

Change the empty-packs redirect from `/upload` to `/create`:

```typescript
// In the smartHome() function, change:
router.replace('/upload');
// to:
router.replace('/create');
```

- [ ] **Step 9: Update `proxy.ts` — protect /create, remove /success**

Read the file first. Then in the matcher config:

- Add `/create` and `/create/:path*` to the protected routes.
- Remove `/success` and `/success/:path*` from the matcher (since the page is deleted).
- Keep `/upload`, `/result/:path*` etc. unchanged.

- [ ] **Step 10: Update `nav-links.ts` — remove "pricing" nav item that links to #pricing (keep the section, just remove nav)**

Actually keep `#pricing` in nav since the section still exists (just with new content). No change needed.

- [ ] **Step 11: Run typecheck**

```bash
npm run -w frontend typecheck 2>&1 | grep "error" | head -20
```

Expected: 0 errors.

---

## Task 7: Fix any tests that referenced deleted pages or old copy

**Files:**

- Modify (if needed): `frontend/src/app/app/__tests__/page.test.tsx`
- Modify (if needed): any test file referencing `/upload` smart-home redirect, `PRICE_LABEL`, subscribe/success routes

**Interfaces:**

- Consumes: everything above

- [ ] **Step 1: Run the test suite to see failures**

```bash
npm run -w frontend test 2>&1 | tail -40
```

Note which tests fail and why.

- [ ] **Step 2: Fix `app/__tests__/page.test.tsx` smart-home redirect**

The test likely asserts `router.replace("/upload")` for first-time users. Update it to assert `router.replace("/create")`.

Find the assertion like:

```typescript
expect(mockRouter.replace).toHaveBeenCalledWith('/upload');
```

Change to:

```typescript
expect(mockRouter.replace).toHaveBeenCalledWith('/create');
```

- [ ] **Step 3: Remove or update tests for subscribe/success pages**

If any test file imports from `subscribe-content.tsx` or `success-content.tsx`, delete or update it. These pages are gone.

- [ ] **Step 4: Run tests again**

```bash
npm run -w frontend test 2>&1 | tail -30
```

Expected: all tests pass (or pre-existing failures unrelated to this PR).

---

## Task 8: Final verification (G)

**Files:** No new files — this is the gate.

- [ ] **Step 1: Typecheck**

```bash
npm run -w frontend typecheck 2>&1
```

Expected: exits 0, no errors.

- [ ] **Step 2: Lint**

```bash
npm run -w frontend lint 2>&1
```

Expected: exits 0, no lint errors.

- [ ] **Step 3: Test**

```bash
npm run -w frontend test 2>&1
```

Expected: all tests pass.

- [ ] **Step 4: Smoke-check JSON integrity**

```bash
node -e "JSON.parse(require('fs').readFileSync('frontend/src/i18n/messages/en.json','utf8')); JSON.parse(require('fs').readFileSync('frontend/src/i18n/messages/ru.json','utf8')); console.log('both JSON files valid')"
```

- [ ] **Step 5: Verify deleted files are gone**

```bash
ls frontend/src/app/subscribe/ 2>&1
ls frontend/src/app/success/ 2>&1
```

Expected: "No such file or directory" for both.

- [ ] **Step 6: Verify PRICE_LABEL is removed everywhere**

```bash
grep -r "PRICE_LABEL\|subscribe\|/success\|\\\$5" frontend/src --include="*.tsx" --include="*.ts" -l
```

Expected: no hits (or only in tests that have been updated, and in proxy.ts the `/success` pattern is gone).

---

## Self-Review Against Spec

**A. Style library** — Task 1 creates `sticker-styles.ts` with all 8 styles, `PROMPT_TEMPLATE` constant (exact text from spec), and `buildPrompt`. ✓

**B. /create page** — Task 3 creates page + 3 components (StylePicker with 8 cards + TODO for real images, PromptBox with copy button, HowTo with 4-step walkthrough + TODO for screenshots). ChatGPT link + Continue button → /upload?style=. ✓

**C. /upload** — Task 4 updates intro text, tips (remove $5 card), actions label, style reminder chip, drops camera button from idle state. ✓

**D. /result/[packId]** — Task 5 removes selfie from header, relabels generating→"splitting & cleaning", updates FailedState to link /create + new message, removes PRICE_LABEL. ✓

**E. Delete payment surfaces** — Task 6 deletes subscribe/ + success/, rewrites pricing.tsx, updates CTA hrefs, smart-home routing, proxy.ts. ✓

**F. i18n** — Task 2 adds `create` namespace, rewrites pricing/faq/how-it-works/upload/result strings, removes $5/Stripe/payment/success block, mirrors in ru.json. ✓

**G. Verify** — Task 7 + 8 fix tests, run typecheck + lint + test. ✓

**Potential issues to watch:**

1. `proxy.ts` — must add `/create` to the protected-routes matcher or unauthenticated users can visit /create. Read the file carefully before editing.
2. `landing/pricing.tsx` previously imported `PRICE_LABEL` — after this plan that import is removed in Task 6 Step 2.
3. The `how-it-works.tsx` layout was `md:grid-cols-3` — changing to 4 steps requires `md:grid-cols-4`. Done in Task 6 Step 3.
4. `pack-showcase` in the landing page uses `bullets.b4` and `bullets.b5` — the new keys from Task 2 don't have a `b5` (only 5 bullets now without the "$5 unlock includes 10 generations" one). Confirm the `PackShowcase` component iterates bullet keys dynamically or hardcodes them.
