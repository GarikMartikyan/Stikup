import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StickerCard } from "@/components/sticker-card";

// Regression: backend pack images are auth-gated (StickerFileController). Next's
// image optimizer fetches images server-side WITHOUT the user's session cookie,
// so optimizing a /api/static/packs/... URL returns 401 and the image breaks
// (notably on the my-stickers dashboard). StickerCard must bypass the optimizer
// for /api/ sources so the browser loads them directly (same-origin → cookie).
describe("StickerCard", () => {
  it("bypasses the Next optimizer for auth-gated backend images (/api/...)", () => {
    render(<StickerCard src="/api/static/packs/abc/sticker_1.webp" alt="s1" />);
    const img = screen.getByAltText("s1") as HTMLImageElement;
    // unoptimized → the raw URL is used directly, NOT the /_next/image proxy.
    expect(img.getAttribute("src")).toBe("/api/static/packs/abc/sticker_1.webp");
    expect(img.getAttribute("src")).not.toContain("/_next/image");
  });

  it("shows a locked sticker's real artwork with a corner lock badge", () => {
    const { container } = render(
      <StickerCard src="/api/static/packs/abc/sticker_5.webp" alt="s5" locked />,
    );
    // Full reveal: the owner previews their own locked artwork (bytes are
    // owner-gated server-side), so the real image is rendered, unoptimized.
    const img = screen.getByAltText("s5") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/api/static/packs/abc/sticker_5.webp");
    // A lock badge (the only inline SVG StickerCard renders) marks it locked.
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("still routes local/bundled images through the optimizer", () => {
    render(<StickerCard src="/assets/anime/anime-styled_01.webp" alt="local" />);
    const img = screen.getByAltText("local") as HTMLImageElement;
    expect(img.getAttribute("src")).toContain("/_next/image");
  });
});
