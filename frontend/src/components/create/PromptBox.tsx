"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "@/components/language-provider";

type PromptBoxProps = {
  prompt: string;
};

export function PromptBox({ prompt }: PromptBoxProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may not be available in non-secure contexts; no-op.
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          {t("create.prompt_label")}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
            copied
              ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
              : "bg-[var(--color-brand)]/10 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/20"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" strokeWidth={3} />
              {t("create.copied")}
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" strokeWidth={2.5} />
              {t("create.copy_prompt")}
            </>
          )}
        </button>
      </div>
      <textarea
        readOnly
        value={prompt}
        rows={10}
        className="w-full resize-none rounded-b-2xl bg-transparent px-4 py-3 font-mono text-xs text-[var(--color-fg-muted)] focus:outline-none"
        aria-label={t("create.prompt_label")}
      />
    </div>
  );
}
