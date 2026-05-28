export function pickDisplayName(
  displayName: string | null | undefined,
  email: string | null,
  fallback: string,
): string {
  const trimmed = displayName?.trim();
  if (trimmed) return trimmed;
  if (email) {
    const local = email.split('@')[0];
    if (local) return local;
    return email;
  }
  return fallback;
}

export function initialFor(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.slice(0, 1).toUpperCase();
}
