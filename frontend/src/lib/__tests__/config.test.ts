import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("config.BACKEND_URL", () => {
  const originalEnv = process.env.BACKEND_URL;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.BACKEND_URL;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.BACKEND_URL;
    } else {
      process.env.BACKEND_URL = originalEnv;
    }
    vi.resetModules();
  });

  it("defaults to http://localhost:3131 when BACKEND_URL is not set", async () => {
    delete process.env.BACKEND_URL;
    const mod = await import("../config");
    expect(mod.BACKEND_URL).toBe("http://localhost:3131");
  });

  it("uses the BACKEND_URL env var when set", async () => {
    process.env.BACKEND_URL = "https://api.example.com";
    const mod = await import("../config");
    expect(mod.BACKEND_URL).toBe("https://api.example.com");
  });
});
