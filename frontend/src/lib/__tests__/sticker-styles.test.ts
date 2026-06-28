import { describe, it, expect } from "vitest";
import {
  buildPrompt,
  promptToChatGPTUrl,
  STICKER_STYLES,
} from "../sticker-styles";

describe("promptToChatGPTUrl", () => {
  it("targets chatgpt.com with the prompt in ?q=", () => {
    const url = promptToChatGPTUrl("hello world");
    expect(url).toBe("https://chatgpt.com/?q=hello%20world");
  });

  it("strips markdown headings, bullets, blockquotes and emphasis", () => {
    const decoded = decodeURIComponent(
      promptToChatGPTUrl(
        "# Title\n> quote\n* one\n* two\n**bold** and *italic*",
      ).replace("https://chatgpt.com/?q=", ""),
    );
    expect(decoded).toBe("Title quote one two bold and italic");
  });

  it("downgrades Unicode punctuation to ASCII", () => {
    const decoded = decodeURIComponent(
      promptToChatGPTUrl("4 × 3 — a · b – c").replace(
        "https://chatgpt.com/?q=",
        "",
      ),
    );
    expect(decoded).toBe("4 x 3 - a / b - c");
  });

  it("rewrites hex color codes to a URL-safe form", () => {
    const decoded = decodeURIComponent(
      promptToChatGPTUrl("solid green (#00B140)").replace(
        "https://chatgpt.com/?q=",
        "",
      ),
    );
    expect(decoded).toBe("solid green (hex 00B140)");
  });

  it("collapses every real sticker prompt onto a single line with no '#'", () => {
    for (const style of STICKER_STYLES) {
      const url = promptToChatGPTUrl(buildPrompt(style.id));
      const decoded = decodeURIComponent(
        url.replace("https://chatgpt.com/?q=", ""),
      );
      expect(url.startsWith("https://chatgpt.com/?q=")).toBe(true);
      expect(decoded).not.toContain("\n");
      expect(decoded).not.toContain("#");
      expect(decoded).not.toMatch(/\s{2,}/);
    }
  });
});
