import { requireSession } from "@/lib/auth/require-session";
import { StoreProvider } from "@/lib/store/providers";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return <StoreProvider>{children}</StoreProvider>;
}
