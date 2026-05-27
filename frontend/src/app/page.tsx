import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Download,
  Heart,
  Lock,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  Timer,
  Upload,
  Zap,
} from "lucide-react";
import {Brand} from "@/components/brand";
import {ThemeToggle} from "@/components/theme-toggle";
import {StickerCard} from "@/components/sticker-card";

const ALL_STICKERS = Array.from({ length: 12 }, (_, i) => ({
  src: `/assets/sticker_${i + 1}.webp`,
  alt: `Sticker ${i + 1}`,
}));

const HERO_STICKERS = [
  { idx: 0, r: -8, t: "5%", l: "0%", d: 0 },
  { idx: 1, r: 6, t: "0%", l: "55%", d: 120 },
  { idx: 2, r: -4, t: "32%", l: "75%", d: 240 },
  { idx: 3, r: 8, t: "60%", l: "62%", d: 360 },
  { idx: 4, r: -10, t: "70%", l: "10%", d: 480 },
  { idx: 5, r: 4, t: "38%", l: "-2%", d: 600 },
];

const STEPS = [
  {
    icon: MessageCircle,
    eyebrow: "01",
    title: "DM the bot",
    body: "Open @stikup_bot and tap /start. We send you a one-tap link straight into the app — no passwords.",
  },
  {
    icon: Upload,
    eyebrow: "02",
    title: "Drop one selfie",
    body: "Front-facing photo, good light, one face. We check it instantly and tell you if anything looks off.",
  },
  {
    icon: Sparkles,
    eyebrow: "03",
    title: "Get 3 free, unlock 12",
    body: "Your full pack of 12 generates upfront. Take the 3 free ones — or pay once to unlock all 12 and have the bot install it.",
  },
];

const FEATURES = [
  {
    icon: Timer,
    title: "Ready in ~3 minutes",
    body: "Synchronous flow. Watch your pack come to life while you wait.",
  },
  {
    icon: Heart,
    title: "Likeness that lands",
    body: "Tight prompts + a forgiving cartoon style so people actually recognise you.",
  },
  {
    icon: Send,
    title: "Real Telegram pack",
    body: "Created under your Telegram account. Yours forever. Install with one tap.",
  },
  {
    icon: Download,
    title: "Yours to download",
    body: "Grab the WebPs or PNGs and use them anywhere — TikTok, IG, Discord, you name it.",
  },
];

const FAQS = [
  {
    q: "How does it actually work?",
    a: "You message our Telegram bot. It opens a webpage where you upload one selfie. About 1–3 minutes later, you see all 12 stickers — 3 are free to take, and the other 9 are visibly locked. Pay once to unlock the whole pack and the bot installs it to your Telegram.",
  },
  {
    q: "What’s included when I pay?",
    a: "All 12 stickers unlock instantly — no second wait. The bot creates a real Telegram sticker set you own and DMs you the install link. You also get one regeneration of that pack in case the result isn’t quite right.",
  },
  {
    q: "Can I make more than one pack?",
    a: "Yes — each pack is a separate purchase. After your first paid pack, you can upload a new photo and run the flow again. No subscription, no surprise charges.",
  },
  {
    q: "What about my photo?",
    a: "Stored only while your account exists. Delete your account from settings — the photo, the pack, the generated files all cascade out. GDPR-ready from day one.",
  },
  {
    q: "Why are 9 stickers locked instead of just hidden?",
    a: "So you can see exactly what you’d be unlocking. The locked previews are the real generated stickers — visible, with a small lock badge on top. Paying flips the badge off and installs all 12 to your Telegram, no second AI call.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative w-full overflow-x-hidden text-[var(--color-fg)]">
      {/* Atmospheric backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(224,52,154,0.18),transparent_70%),radial-gradient(ellipse_55%_55%_at_80%_15%,rgba(255,180,34,0.18),transparent_70%),radial-gradient(ellipse_50%_50%_at_15%_20%,rgba(30,200,255,0.12),transparent_70%)]" />
      <div
        className="pointer-events-none absolute -top-32 -left-24 -z-10 h-[480px] w-[480px] rounded-full bg-[var(--color-brand)]/25 blur-3xl"
        style={{ animation: "drift 14s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -top-20 right-0 -z-10 h-[440px] w-[440px] rounded-full bg-[var(--color-brand-2)]/25 blur-3xl"
        style={{ animation: "drift 18s ease-in-out infinite reverse" }}
      />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/60 bg-[var(--color-bg)]/75 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Brand />
          <div className="hidden items-center gap-7 text-sm font-medium text-[var(--color-fg-muted)] md:flex">
            <a href="#how" className="hover:text-[var(--color-fg)] transition">How it works</a>
            <a href="#pack" className="hover:text-[var(--color-fg)] transition">The pack</a>
            <a href="#pricing" className="hover:text-[var(--color-fg)] transition">Pricing</a>
            <a href="#faq" className="hover:text-[var(--color-fg)] transition">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-fg)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] shadow-sm transition hover:opacity-90"
            >
              Open in Telegram
              <Send className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center px-5 pt-20 pb-10 md:pt-14">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1.05fr_1fr]">
          <div>
            <span
              className="reveal inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)]/25 bg-[var(--color-brand)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-brand)]"
              style={{ animationDelay: "0ms" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] animate-pulse" />
              New · 12 stickers in a minute
            </span>

            <h1
              className="reveal mt-5 font-[family-name:var(--font-display)] text-[3.25rem] font-extrabold leading-[1.02] tracking-[-0.03em] md:text-[5.5rem]"
              style={{ animationDelay: "100ms" }}
            >
              A sticker pack of{" "}
              <span className="relative inline-block">
                <span className="gradient-text bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] bg-clip-text text-transparent">
                  YOU
                </span>
                <svg
                  aria-hidden
                  className="absolute -bottom-3 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                >
                  <path
                    d="M2 9 C 60 -1, 140 -1, 198 9"
                    stroke="url(#u)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="u" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#e0349a" />
                      <stop offset="1" stopColor="#ffb422" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              ,
              <br className="hidden md:block" /> in your Telegram.
            </h1>

            <p
              className="reveal mt-7 max-w-md text-lg text-[var(--color-fg-muted)]"
              style={{ animationDelay: "200ms" }}
            >
              One selfie. Twelve cartoon stickers. Yours forever — installed
              straight into Telegram by our bot. No artists. No prompts.
            </p>

            <div
              className="reveal mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/upload"
                className="shimmer group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] px-7 py-4 text-base font-bold text-white shadow-[0_18px_40px_-12px_rgba(224,52,154,0.55)] transition hover:-translate-y-0.5"
              >
                <Sparkles className="h-5 w-5" />
                <span>Make my stickers</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elev)] px-7 py-4 text-base font-semibold text-[var(--color-fg)] transition hover:-translate-y-0.5"
              >
                See how it works
              </a>
            </div>

            <div
              className="reveal mt-10 flex items-center gap-5 text-sm text-[var(--color-fg-muted)]"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex -space-x-2">
                {ALL_STICKERS.slice(0, 4).map((s, i) => (
                  <div
                    key={i}
                    className="h-9 w-9 overflow-hidden rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-bg-elev)]"
                  >
                    <Image
                      src={s.src}
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-[var(--color-brand-2)]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs">Loved by early testers</span>
              </div>
            </div>
          </div>

          {/* RIGHT: portrait + floating stickers */}
          <div className="relative mx-auto h-[450px] w-full max-w-md md:h-[480px]">
            <div className="absolute inset-6 -z-10 rounded-[2.5rem] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(224,52,154,0.35),rgba(255,180,34,0.35),rgba(30,200,255,0.3),rgba(224,52,154,0.35))] blur-3xl opacity-70" />

            <div
              className="reveal absolute left-1/2 top-1/2 h-[270px] w-[210px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] shadow-[var(--shadow-card)]"
              style={{ animationDelay: "120ms" }}
            >
              <Image
                src="/assets/real_image.webp"
                alt="Your selfie"
                width={420}
                height={540}
                priority
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-[var(--color-fg)]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-bg)] backdrop-blur">
                <span>Your selfie</span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                  ready
                </span>
              </div>
            </div>

            {/* Floating sticker satellites */}
            {HERO_STICKERS.map(({ idx, r, t, l, d }) => (
              <div
                key={idx}
                className="absolute h-24 w-24 md:h-28 md:w-28"
                style={{
                  top: t,
                  left: l,
                  animation: `pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1) ${600 + d}ms both, float-soft 6s ease-in-out ${1 + d / 1000}s infinite`,
                }}
              >
                <div
                  className="relative h-full w-full rounded-[28%] bg-[var(--color-bg-elev)] shadow-[var(--shadow-sticker)] ring-1 ring-[var(--color-border)]"
                  style={{ transform: `rotate(${r}deg)` }}
                >
                  <Image
                    src={ALL_STICKERS[idx].src}
                    alt=""
                    width={160}
                    height={160}
                    className="h-full w-full object-contain p-1.5"
                  />
                </div>
              </div>
            ))}

            <div
              className="absolute -bottom-6 right-2 rotate-6 rounded-2xl bg-[var(--color-fg)] px-4 py-2 text-sm font-bold text-[var(--color-bg)] shadow-xl"
              style={{ animation: "fade-up 0.6s ease-out 1.4s both" }}
            >
              12 stickers · WebP · 512px
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <section
        aria-hidden
        className="relative overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-bg-sunk)] py-6"
      >
        <div className="marquee-track gap-6 px-6">
          {[...ALL_STICKERS, ...ALL_STICKERS].map((s, i) => (
            <div
              key={i}
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[var(--color-bg-elev)] ring-1 ring-[var(--color-border)] shadow-sm md:h-20 md:w-20"
            >
              <Image
                src={s.src}
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-contain p-1.5"
              />
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="reveal max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
              How it works
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
              Three steps.
              <br />
              <span className="text-[var(--color-fg-muted)]">No prompts to write.</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg text-[var(--color-fg-muted)]">
              The whole flow is built for one-handed mobile use — because
              that&apos;s where Telegram lives.
            </p>
          </div>

          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="reveal group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-7 transition hover:-translate-y-2 hover:border-[var(--color-border-strong)]"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-[var(--color-brand)]/25 to-[var(--color-brand-2)]/20 opacity-70 blur-2xl transition group-hover:opacity-90" />
                <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-lg">
                  <step.icon className="h-7 w-7" strokeWidth={2} />
                </div>
                <div className="mt-6 font-mono text-xs font-bold tracking-[0.2em] text-[var(--color-fg-subtle)]">
                  STEP {step.eyebrow}
                </div>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-[var(--color-fg-muted)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* THE PACK — live demo of the unlock flow */}
      <section id="pack" className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center bg-[var(--color-bg-sunk)] py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="grid items-center gap-14 md:grid-cols-[1fr_1.1fr]">
            <div className="reveal">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-2)]">
                The pack
              </span>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
                Here&apos;s what you actually get.
              </h2>
              <p className="mt-5 max-w-md text-lg text-[var(--color-fg-muted)]">
                Every pack is 12 stickers, generated from one photo. You see all
                12 right away — 3 are free to take, 9 stay locked until you
                unlock the pack.
              </p>

              <ul className="mt-7 space-y-3">
                {[
                  "12 expressive emotions, hand-curated",
                  "Real Telegram sticker set you own",
                  "Free 3 stickers — no payment required",
                  "Pay once to unlock all 12, no subscription",
                  "One regeneration included with every paid pack",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[var(--color-fg)]"
                  >
                    <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/upload"
                className="mt-8 inline-flex items-center gap-2 text-base font-bold text-[var(--color-brand)] hover:opacity-80"
              >
                Try the free preview
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* The 12-grid mockup with 3 unlocked + 9 locked */}
            <div className="reveal" style={{ animationDelay: "120ms" }}>
              <div className="relative mx-auto max-w-md">
                <div
                  className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-[var(--color-brand)]/35 via-[#ff5e72]/30 to-[var(--color-brand-2)]/35 opacity-50 blur-2xl"
                  style={{ animation: "drift 12s ease-in-out infinite" }}
                />
                <div className="relative rounded-[2.25rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 overflow-hidden rounded-full ring-2 ring-[var(--color-brand)]/30">
                        <Image
                          src="/assets/real_image.webp"
                          alt=""
                          width={60}
                          height={60}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-bold">Your pack · ready</div>
                        <div className="text-[10px] text-[var(--color-fg-subtle)]">
                          t.me/addstickers/stikup_you
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-[var(--color-fg)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-bg)]">
                      12/12
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2.5">
                    {ALL_STICKERS.map((s, i) => (
                      <StickerCard
                        key={i}
                        src={s.src}
                        alt={s.alt}
                        locked={i >= 3}
                        rotate={(i % 2 === 0 ? 1 : -1) * (i % 3)}
                        delay={i * 50}
                        popIn
                      />
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-[var(--color-border-strong)] p-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Lock className="h-3.5 w-3.5 text-[var(--color-fg-muted)]" />
                      <span className="text-[var(--color-fg-muted)]">9 stickers locked</span>
                    </div>
                    <Link
                      href="/upload"
                      className="rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-2)] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
                    >
                      Unlock all 12
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="reveal max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Why Stikup
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
              Built for the chat,
              <br />
              <span className="text-[var(--color-fg-muted)]">not the gallery.</span>
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="reveal group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-7 transition hover:-translate-y-1 hover:border-[var(--color-border-strong)]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] text-white shadow-md">
                  <f.icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center py-16 md:py-20">
        <div className="mx-auto w-full max-w-3xl px-5 text-center">
          <div className="reveal">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
              Pricing
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-6xl">
              One pack. One price.
              <br />
              <span className="text-[var(--color-fg-muted)]">No subscription. Ever.</span>
            </h2>
            <p className="mt-5 text-lg text-[var(--color-fg-muted)]">
              Try the 3-sticker preview free. Pay once to unlock the full pack —
              keep it forever.
            </p>
          </div>

          <div className="reveal relative mt-12" style={{ animationDelay: "150ms" }}>
            <div
              className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)] opacity-60 blur-xl"
              style={{
                backgroundSize: "300% 300%",
                animation: "gradient-shift 7s ease-in-out infinite",
              }}
            />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-8 text-left shadow-[var(--shadow-card)] md:p-10">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                    Full pack of 12
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-[family-name:var(--font-display)] text-6xl font-black tracking-[-0.04em] md:text-7xl">
                      $5.99
                    </span>
                    <span className="text-[var(--color-fg-muted)]">one-time</span>
                  </div>
                  <div className="mt-1 text-sm text-[var(--color-fg-subtle)]">
                    Regional pricing — pay in your own currency.
                  </div>
                </div>
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-fg)] px-6 py-3.5 text-base font-bold text-[var(--color-bg)] transition hover:opacity-90"
                >
                  Unlock the pack
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="my-7 hr-dotted" />

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "All 12 stickers (3 free + 9 unlocked)",
                  "Real Telegram sticker set you own",
                  "1 free regeneration of the pack",
                  "PNG + WebP downloads",
                  "Bot delivers it for you in seconds",
                  "No watermark. No subscription. No catch.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-[var(--color-fg)]"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-[var(--color-fg-subtle)]">
            Stripe · Apple Pay · Google Pay · CIS, EU, US currency support
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center bg-[var(--color-bg-sunk)] py-16 md:py-20">
        <div className="mx-auto w-full max-w-3xl px-5">
          <div className="reveal text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand)]">
              FAQ
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">
              Questions, answered.
            </h2>
          </div>

          <div className="mt-12 space-y-3">
            {FAQS.map((f, i) => (
              <details
                key={f.q}
                className="reveal group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 transition hover:border-[var(--color-border-strong)] open:border-[var(--color-brand)]/40 open:shadow-md"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[var(--color-fg)]">
                  {f.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-bg-sunk)] text-[var(--color-fg-muted)] transition group-open:rotate-45 group-open:bg-[var(--color-brand)]/15 group-open:text-[var(--color-brand)]">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-[var(--color-fg-muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="snap-section relative flex min-h-dvh scroll-mt-16 flex-col justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand)] via-[#ff5e72] to-[var(--color-brand-2)]"
          style={{
            backgroundSize: "200% 200%",
            animation: "gradient-shift 9s ease-in-out infinite",
          }}
        />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="reveal relative mx-auto max-w-3xl px-5 py-20 text-center text-white">
          <h2 className="font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-[-0.02em] md:text-7xl">
            Your face.
            <br /> Your pack.
            <br /> Three minutes.
          </h2>
          <p className="mt-6 text-lg text-white/90">
            One selfie. We do the rest. Sticker pack waiting in your Telegram.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/upload"
              className="shimmer group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-7 py-4 text-base font-bold text-[var(--color-fg)] shadow-2xl transition hover:scale-105"
            >
              <Sparkles className="h-5 w-5" />
              Try the free preview
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <a
              href="https://t.me/stikup_bot"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Send className="h-5 w-5" />
              Open Telegram bot
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4" /> Ready in 3 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-4 w-4" /> 13+ only · GDPR ready
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-4 w-4" /> Download PNG / WebP
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-[var(--color-fg-muted)]">
          <Brand size="sm" />
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#" className="hover:text-[var(--color-fg)]">Privacy</a>
            <a href="#" className="hover:text-[var(--color-fg)]">Terms</a>
            <a href="#" className="hover:text-[var(--color-fg)]">Support</a>
            <a href="mailto:support@stikup.app" className="hover:text-[var(--color-fg)]">
              support@stikup.app
            </a>
          </div>
          <div>© 2026 Stikup</div>
        </div>
      </footer>
    </div>
  );
}
