import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3131";

async function fetchSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return (await res.json()) as { userId: string };
}

export default async function DashboardPage() {
  const session = await fetchSession();
  if (!session) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start gap-6 px-6 py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Signed in
      </div>
      <h1 className="text-4xl font-black tracking-tight">You&apos;re in.</h1>
      <p className="text-zinc-600">
        User ID: <span className="font-mono text-sm">{session.userId}</span>
      </p>
      <form action="/auth/logout" method="post">
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
