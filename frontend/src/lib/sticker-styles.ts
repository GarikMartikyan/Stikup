export type StyleId =
  | "chibi"
  | "disney3d"
  | "anime"
  | "pixel";

export type StickerStyle = {
  id: StyleId;
  name: string;
  tagline: string;
  /** The "Render the character as ... with:" block + its bullet list. */
  render: string;
  /** Parenthetical guidance appended to the "same hairstyle" identity line. */
  hairNote: string;
  /** Style-specific bullets inserted into the "Sticker Style" section. */
  stickerStyle: string;
};

const PROMPT_TEMPLATE = `Create a **single high-resolution sticker sheet** using the attached reference image.

{STYLE_RENDER}

Preserve the identity of the reference character:

* same hairstyle {HAIR_NOTE}
* same facial features
* same hair color
* same clothing colors and design
* recognizable likeness

## Layout (Strict Requirements)

* Generate **exactly 12 stickers**
* Arrange them in **4 columns × 3 rows**
* One sticker per grid cell
* Do **not** crop, overlap, merge, or omit stickers
* Every sticker must have identical size and scale
* Keep perfect alignment
* Leave wide, even spacing between stickers
* Maintain a continuous band of solid green background between every sticker

## Camera

Every sticker must show:

* head to upper torso (approximately waist-up)
* facing mostly toward the camera
* minimal body movement
* emotion communicated primarily through the face

## Expressions

Use each expression **exactly once**:

1. Laughing
2. Angry
3. Crying
4. Offended
5. Thinking
6. Sleepy
7. Blowing a kiss
8. Winking
9. Surprised
10. Rejoicing (subtle happiness)
11. Confused
12. Confident / sassy

Do not repeat expressions.

## Sticker Style

* crisp sticker cutline
{STYLE_STICKER}
* no motion blur
* no text
* no speech bubbles
* no emojis
* no props
* no accessories not present in the reference
* no decorative elements
* no shadows on the background

## Background

Background must be:

* solid green (#00B140)
* perfectly flat color
* no gradients
* no texture
* no lighting variation

## Priority

The most important requirements are:

1. Exactly **12** stickers.
2. **4×3** grid.
3. Character remains faithful to the reference.
4. Distinct facial expressions.
5. Uniform sticker size and spacing.
6. Solid green background.`;

export const STICKER_STYLES: StickerStyle[] = [
  {
    id: "chibi",
    name: "Chibi",
    tagline: "Cute & soft",
    render: `Render the character in a cute **2D chibi style** with:

* soft, exaggerated proportions (large head, small body)
* clean rounded linework
* smooth pastel-style shading
* big, sparkling eyes
* a soft, friendly look`,
    hairNote: "(simplified into soft, rounded shapes)",
    stickerStyle: `* strictly 2D (no 3D effects, no realism)
* thin white sticker outline around each face`,
  },
  {
    id: "disney3d",
    name: "Disney 3D",
    tagline: "Pixar-style 3D",
    render: `Render the character as a polished **3D animated movie character inspired by modern family animation** with:

* soft rounded forms
* large expressive eyes
* smooth skin shading
* warm cinematic lighting
* clean, simplified Disney/Pixar-inspired proportions`,
    hairNote: "(rounded edges, no sharp spikes)",
    stickerStyle: `* clean silhouette`,
  },
  {
    id: "anime",
    name: "Anime",
    tagline: "Crisp cel-shaded",
    render: `Render the character in a clean **modern anime style** with:

* crisp cel-shaded coloring
* defined, confident linework
* large expressive eyes
* vibrant but balanced colors
* clean flat highlights and shadows`,
    hairNote: "(keep defined strands and original shape)",
    stickerStyle: `* 2D cel-shaded anime look
* sharp, clean outlines`,
  },
  {
    id: "pixel",
    name: "Pixel",
    tagline: "Retro 16-bit",
    render: `Render the character as retro **16-bit pixel art** with:

* blocky, clearly visible square pixels
* a limited, vibrant retro palette
* clear pixel-level expression detail
* a classic video-game sprite look
* no smooth anti-aliasing on the character`,
    hairNote: "(rendered in blocky pixel shapes)",
    stickerStyle: `* pixel-art style with visible square pixels
* limited retro color palette`,
  },
];

export function buildPrompt(styleId: StyleId): string {
  const style = STICKER_STYLES.find((s) => s.id === styleId);
  if (!style) throw new Error(`Unknown styleId: ${styleId}`);
  return PROMPT_TEMPLATE.replace("{STYLE_RENDER}", style.render)
    .replace("{HAIR_NOTE}", style.hairNote)
    .replace("{STYLE_STICKER}", style.stickerStyle);
}

/**
 * Turn a generated sticker prompt into a ChatGPT deep link that pre-fills the
 * composer via `?q=`. The prompt is flattened to a single plain-text line first:
 * markdown markers are stripped and Unicode punctuation (em/en dashes, ×, ·, …)
 * is downgraded to ASCII so the resulting URL stays short and survives ChatGPT's
 * mobile redirect (a raw multi-line markdown prompt produced "invalid URL").
 */
export function promptToChatGPTUrl(prompt: string): string {
  const clean = prompt
    // Remove markdown blockquote markers
    .replace(/^>\s*/gm, "")
    // Remove markdown headings
    .replace(/^#{1,6}\s*/gm, "")
    // Remove bold/italic markers
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    // Convert bullet list items (* item) to inline text
    .replace(/^\*\s+/gm, "")
    // Replace Unicode em dash with hyphen
    .replace(/—/g, "-")
    // Replace Unicode en dash with hyphen
    .replace(/–/g, "-")
    // Replace middle dot with slash
    .replace(/·/g, "/")
    // Replace multiplication sign with x
    .replace(/×/g, "x")
    // Replace hex color codes: #RRGGBB -> hex RRGGBB
    .replace(/#([0-9A-Fa-f]{3,6})\b/g, "hex $1")
    // Collapse all newlines and surrounding whitespace into a single space
    .replace(/\s*\n+\s*/g, " ")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    .trim();

  return "https://chatgpt.com/?q=" + encodeURIComponent(clean);
}
