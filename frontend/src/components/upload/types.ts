export type FileState =
  | { kind: "idle" }
  | { kind: "ready"; file: File; url: string }
  | { kind: "error"; message: string };

export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const ACCEPTED = ["image/jpeg", "image/png", "image/heic", "image/heif"];
