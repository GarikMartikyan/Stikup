import { cookies } from "next/headers";
import { BACKEND_URL } from "./config";

/**
 * Forward the incoming request cookies to the backend.
 *
 * Server components only — this depends on `next/headers` and will throw if
 * imported into a Client Component. Returns `null` on any non-2xx response
 * so callers can branch (e.g. `redirect('/')` on missing session).
 */
export async function serverFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${BACKEND_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      cookie: cookieHeader,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) return null;
  return (await res.json()) as T;
}
