'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Copy, ExternalLink } from 'lucide-react';
import { StylePicker } from '@/components/create/StylePicker';
import {
  buildPrompt,
  promptToChatGPTUrl,
  STICKER_STYLES,
  type StyleId,
} from '@/lib/sticker-styles';
import { useT } from '@/components/language-provider';

export default function CreatePage() {
  const t = useT();
  const [selectedStyle, setSelectedStyle] = useState<StyleId>(
    STICKER_STYLES[0].id,
  );
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const prompt = buildPrompt(selectedStyle);

  const handleCopy = async () => {
    // Flip hasInteracted FIRST so the "Continue" step reveals even if the
    // clipboard write is blocked (insecure context / denied permission) — the
    // prompt is still reachable via the ChatGPT ?q= pre-fill, so the user must
    // never be left without a way forward.
    setHasInteracted(true);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — no "Copied!" confirmation, but the flow proceeds.
    }
  };

  // "Open ChatGPT" advances the current tab to /upload while the anchor's
  // target="_blank" opens ChatGPT in a NEW tab with the prompt pre-filled via
  // ?q= (see promptToChatGPTUrl — it flattens the markdown to a short, single
  // line so the URL survives ChatGPT's mobile redirect). We still copy the
  // prompt as a fallback in case the composer doesn't auto-populate. The user
  // attaches their image there, generates the grid, then returns to the
  // (already-on-/upload) app tab to upload it.
  const openChatGpt = () => {
    void handleCopy();
    router.push('/upload');
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-6 pb-16 md:py-10 md:pb-20">
        {/* Header */}
        <div className="reveal max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
            {t('create.eyebrow')}
          </span>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
            {t('create.title')}
          </h1>
          <p className="mt-2 text-base text-[var(--color-fg-muted)] md:text-lg">
            {t('create.description')}
          </p>
        </div>

        {/* Style picker */}
        <div className="reveal mt-8" style={{ animationDelay: '80ms' }}>
          <StylePicker selected={selectedStyle} onSelect={setSelectedStyle} />
        </div>

        {/* Copy + Open ChatGPT */}
        <div
          className="reveal mt-6 flex flex-wrap items-center gap-3"
          style={{ animationDelay: '150ms' }}
        >
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
              copied
                ? 'border-green-500 bg-transparent text-green-500'
                : 'border-[var(--color-border-strong)] bg-transparent text-[var(--color-fg)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
            }`}
          >
            <Copy className="h-4 w-4" strokeWidth={2.2} />
            {copied ? t('create.copied') : t('create.copy_prompt')}
          </button>
          <a
            href={promptToChatGPTUrl(prompt)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={openChatGpt}
            className="inline-flex items-center gap-2 rounded-full bg-[#10a37f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#0d8f6f]"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={2.2} />
            {t('create.open_chatgpt')}
          </a>
        </div>

        {/* Next step — hidden until the user copies the prompt */}
        {hasInteracted && (
          <div className="reveal mt-4" style={{ animationDelay: '200ms' }}>
            <Link
              href="/upload"
              className="shimmer group inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
            >
              {t('create.continue')}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        )}

        {/* How-to hint */}
        <div
          className="reveal mt-5 text-sm text-[var(--color-fg-muted)]"
          style={{ animationDelay: '230ms' }}
        >
          {t('create.hint_prefix')}{' '}
          <Link
            href="/how-to"
            className="font-semibold text-[var(--color-brand)] underline-offset-2 hover:underline"
          >
            {t('create.hint_link')}
          </Link>
        </div>
      </main>
    </div>
  );
}
