export type StyleId =
  | "chibi"
  | "disney3d"
  | "anime"
  | "ghibli"
  | "comic"
  | "pixel"
  | "clay"
  | "popart";

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
    id: "chibi",
    name: "Chibi",
    tagline: "Cute & soft",
    styleIntro:
      "Render the character in a cute 2D chibi style with soft, exaggerated proportions (large head, small body), clean rounded linework, and smooth pastel-style shading.",
    styleConstraints:
      "- Strictly 2D (no 3D effects, no realism)\n- Thin white sticker outline around each face",
  },
  {
    id: "disney3d",
    name: "Disney 3D",
    tagline: "Pixar-style 3D",
    styleIntro:
      "Render the character as a polished 3D animated movie character in the style of modern Disney·Pixar films — soft rounded forms, large expressive eyes, warm cinematic lighting, and smooth subsurface-style skin shading.",
    styleConstraints:
      "- Stylized 3D render with soft global illumination (friendly, not photoreal)\n- Clean silhouette suitable for a sticker",
  },
  {
    id: "anime",
    name: "Anime",
    tagline: "Crisp cel-shaded",
    styleIntro:
      "Render the character in a clean modern anime style — crisp cel-shaded coloring, defined linework, expressive large eyes, and vibrant but balanced colors.",
    styleConstraints:
      "- 2D cel-shaded anime look\n- Sharp clean outlines",
  },
  {
    id: "ghibli",
    name: "Ghibli",
    tagline: "Soft & painterly",
    styleIntro:
      "Render the character in a soft, hand-painted Studio-Ghibli-inspired style — gentle watercolor-like shading, warm earthy palette, soft rounded features, and a calm storybook feel.",
    styleConstraints:
      "- Soft 2D painterly look with gentle outlines\n- Cozy, warm color palette",
  },
  {
    id: "comic",
    name: "Comic",
    tagline: "Bold cartoon",
    styleIntro:
      "Render the character as a bold Western-cartoon / comic character — thick confident outlines, flat bright colors, simple cel shading, and exaggerated readable expressions.",
    styleConstraints:
      "- 2D comic style with bold black outlines\n- Flat, punchy colors",
  },
  {
    id: "pixel",
    name: "Pixel",
    tagline: "Retro 16-bit",
    styleIntro:
      "Render the character as retro 16-bit pixel art — blocky pixels, a limited vibrant palette, and clear pixel-level expression detail, like a classic video-game sprite.",
    styleConstraints:
      "- Pixel-art style with visible square pixels (no smooth anti-aliasing on the character)\n- Limited retro color palette",
  },
  {
    id: "clay",
    name: "Clay",
    tagline: "Claymation",
    styleIntro:
      "Render the character as a cute claymation / plasticine model — soft matte clay texture, rounded handmade forms, gentle sculpt marks, and soft studio lighting.",
    styleConstraints:
      "- Stylized 3D clay look (stop-motion feel)\n- Soft, matte surfaces",
  },
  {
    id: "popart",
    name: "Pop Art",
    tagline: "Bold & vibrant",
    styleIntro:
      "Render the character as bold pop-art — high-contrast flat colors, clean fills, thick outlines, and vibrant comic-poster energy.",
    styleConstraints:
      "- 2D pop-art style with bold saturated colors and strong outlines\n- Keep the character clean (solid green background only, as specified)",
  },
];

export function buildPrompt(styleId: StyleId): string {
  const style = STICKER_STYLES.find((s) => s.id === styleId);
  if (!style) throw new Error(`Unknown styleId: ${styleId}`);
  return PROMPT_TEMPLATE.replace("{STYLE_INTRO}", style.styleIntro)
    .replace("{STYLE_NAME}", style.name)
    .replace("{STYLE_CONSTRAINTS}", style.styleConstraints);
}
