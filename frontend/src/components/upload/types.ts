export type FileState =
  | { kind: "idle" }
  | { kind: "ready"; file: File; url: string }
  | { kind: "error"; message: string };

export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
// Formats the backend can actually split: cv2.imread reads JPEG/PNG/WebP but
// NOT HEIC/HEIF, so those are intentionally excluded here to avoid accepting an
// upload that would only fail in the worker. ChatGPT grid downloads are PNG or
// WebP, so this covers the real input.
export const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
