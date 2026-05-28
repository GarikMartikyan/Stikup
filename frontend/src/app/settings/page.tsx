import { requireSession } from "@/lib/auth/require-session";
import { SettingsContent } from "./settings-content";

export default async function SettingsPage() {
  const session = await requireSession();
  return <SettingsContent email={session.email} />;
}
