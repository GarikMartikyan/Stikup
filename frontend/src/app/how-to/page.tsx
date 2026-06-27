'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  ClipboardCopy,
  Download,
  ExternalLink,
  Play,
  Sparkles,
  Upload,
  Users,
  Wand2,
  Zap,
} from 'lucide-react';
import { useT } from '@/components/language-provider';

const STEP_ICONS = [Wand2, ClipboardCopy, Bot, Download, Upload, Users];

export default function HowToPage() {
  const t = useT();
  const [hasPacks, setHasPacks] = useState<boolean | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [ended, setEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch('/api/packs', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setHasPacks(Array.isArray(data) && data.length > 0))
      .catch(() => setHasPacks(false));
  }, []);

  function openVideo() {
    setEnded(false);
    setShowVideo(true);
  }

  type Step = {
    icon: (typeof STEP_ICONS)[number];
    title: string;
    body: string;
    note?: string;
    options?: { label: string; icon: React.ElementType; text: string }[];
  };

  const steps: Step[] = [
    {
      icon: STEP_ICONS[0],
      title: t('how_to.step1_title'),
      body: t('how_to.step1_body'),
    },
    {
      icon: STEP_ICONS[1],
      title: t('how_to.step2_title'),
      body: t('how_to.step2_body'),
      options: [
        {
          label: t('how_to.step2_option_a_label'),
          icon: ExternalLink,
          text: t('how_to.step2_option_a'),
        },
        {
          label: t('how_to.step2_option_b_label'),
          icon: ClipboardCopy,
          text: t('how_to.step2_option_b'),
        },
      ],
    },
    {
      icon: STEP_ICONS[2],
      title: t('how_to.step3_title'),
      body: t('how_to.step3_body'),
      note: t('how_to.step3_note'),
    },
    {
      icon: STEP_ICONS[3],
      title: t('how_to.step4_title'),
      body: t('how_to.step4_body'),
      note: t('how_to.step4_note'),
    },
    {
      icon: STEP_ICONS[4],
      title: t('how_to.step5_title'),
      body: t('how_to.step5_body'),
    },
    {
      icon: STEP_ICONS[5],
      title: t('how_to.step6_title'),
      body: t('how_to.step6_body'),
    },
  ];

  return (
    <>
      {/* Tutorial video overlay (locked until it ends) */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
          {/* Header */}
          <div className="shrink-0 px-5 pb-3 pt-7 text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
              Tutorial
            </span>
            <h2 className="mt-1 text-base font-semibold text-white">
              How to create your sticker pack
            </h2>
          </div>

          {/* Video */}
          <div className="flex flex-1 items-center justify-center overflow-hidden px-4">
            <video
              ref={videoRef}
              src="/how-to-disney.mp4"
              autoPlay
              muted
              playsInline
              className="max-h-full max-w-md rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
              onEnded={() => setEnded(true)}
              onError={() => setEnded(true)}
            />
          </div>

          {/* Footer: Next appears only after the video ends */}
          <div className="flex shrink-0 items-center justify-center px-5 pb-9 pt-4">
            {ended ? (
              <Link
                href="/create"
                className="shimmer group inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-8 py-4 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            ) : (
              <p className="text-sm font-medium text-white/50">
                Watch the video to continue
              </p>
            )}
          </div>
        </div>
      )}

      <div className="relative flex flex-1 flex-col">
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-10 md:py-16">
          {/* Header */}
          <div className="reveal">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
              Guide
            </span>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
              {t('how_to.page_title')}
            </h1>
            <p className="mt-3 text-base text-[var(--color-fg-muted)] md:text-lg">
              {t('how_to.page_subtitle')}
            </p>
          </div>

          {/* Steps */}
          <ol
            className="reveal mt-10 flex flex-col gap-4"
            style={{ animationDelay: '80ms' }}
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === steps.length - 1;
              return (
                <li key={i} className="relative flex gap-5">
                  {!isLast && (
                    <div
                      aria-hidden
                      className="absolute bottom-0 left-[1.1875rem] top-12 w-px bg-[var(--color-border)]"
                    />
                  )}
                  <div className="relative z-10 mt-1 flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand)]/20 to-[var(--color-brand-2)]/20 ring-1 ring-[var(--color-border)]">
                    <Icon
                      className="h-4.5 w-4.5 text-[var(--color-brand)]"
                      strokeWidth={2.2}
                    />
                  </div>
                  <div className="min-w-0 flex-1 pb-7">
                    <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[var(--color-fg-subtle)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h2 className="mt-0.5 text-base font-semibold text-[var(--color-fg)]">
                      {step.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-fg-muted)]">
                      {step.body}
                    </p>

                    {step.options && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {step.options.map((opt, j) => {
                          const OptionIcon = opt.icon;
                          return (
                            <div
                              key={j}
                              className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
                            >
                              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                                <OptionIcon
                                  className="h-3.5 w-3.5"
                                  strokeWidth={2.2}
                                />
                              </span>
                              <div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-brand)]">
                                  {j === 0 && (
                                    <Zap className="h-2.5 w-2.5" strokeWidth={2.5} />
                                  )}
                                  {opt.label}
                                </span>
                                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-fg-muted)]">
                                  {opt.text}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {step.note && (
                      <div className="mt-3 inline-flex items-start gap-2 rounded-xl bg-[var(--color-brand)]/8 px-3 py-2 text-xs text-[var(--color-fg-muted)]">
                        <Sparkles
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-brand)]"
                          strokeWidth={2.2}
                        />
                        <span>{step.note}</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* CTA row */}
          <div
            className="reveal mt-2 flex flex-wrap items-center gap-3"
            style={{ animationDelay: '180ms' }}
          >
            {/* Watch video — primary action */}
            <button
              onClick={openVideo}
              className="shimmer group inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-7 py-4 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>Watch video</span>
            </button>

            {/* Skip — only once the user already has a sticker pack */}
            {hasPacks && (
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-6 py-4 text-base font-semibold text-[var(--color-fg)] transition hover:-translate-y-0.5 hover:bg-[var(--color-bg-subtle)]"
              >
                <span>Skip</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
