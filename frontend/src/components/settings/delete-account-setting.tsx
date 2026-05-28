"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useDeleteMeMutation } from "@/lib/store/auth-api";
import { useT } from "@/components/language-provider";

const CONFIRM_PHRASE = "delete";

export function DeleteAccountSetting({ email }: { email: string | null }) {
  const router = useRouter();
  const t = useT();
  const [deleteMe, { isLoading }] = useDeleteMeMutation();
  const [confirming, setConfirming] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canDelete = phrase.trim().toLowerCase() === CONFIRM_PHRASE;

  async function handleDelete() {
    if (!canDelete || isLoading) return;
    setError(null);
    try {
      await deleteMe().unwrap();
      router.push("/");
      router.refresh();
    } catch {
      setError(t("settings.delete_account.error_failed"));
    }
  }

  if (!confirming) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-fg-muted)]">
          {email
            ? t("settings.delete_account.signed_in_as", { email })
            : t("settings.delete_account.action_permanent")}
        </p>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center justify-center rounded-full border border-[var(--color-danger)]/40 px-4 py-2 text-sm font-bold text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/10"
        >
          {t("settings.delete_account.delete_button")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-4">
      <p className="text-sm font-semibold text-[var(--color-fg)]">
        {t("settings.delete_account.confirm_type")}{" "}
        <span className="font-mono">{CONFIRM_PHRASE}</span>{" "}
        {t("settings.delete_account.confirm_to_confirm")}
      </p>
      <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
        {t("settings.delete_account.confirm_body")}
      </p>
      <input
        type="text"
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        autoFocus
        aria-label={t("settings.delete_account.confirm_aria", { phrase: CONFIRM_PHRASE })}
        placeholder={CONFIRM_PHRASE}
        className="mt-3 w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-danger)] focus:ring-2 focus:ring-[var(--color-danger)]/30"
      />
      {error && (
        <p
          role="alert"
          className="mt-2 text-xs font-semibold text-[var(--color-danger)]"
        >
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || isLoading}
          className="inline-flex items-center justify-center rounded-full bg-[var(--color-danger)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? t("settings.delete_account.deleting") : t("settings.delete_account.permanently_delete")}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setPhrase("");
            setError(null);
          }}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-4 py-2 text-sm font-bold text-[var(--color-fg)] transition hover:bg-[var(--color-bg-sunk)] disabled:opacity-50"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
