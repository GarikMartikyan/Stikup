import {
  ArrowRight,
  Camera,
  Check,
  Download,
  Heart,
  MessageCircle,
  Palette,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Star,
  Upload,
  Zap,
} from "lucide-react";

const stickers = [
  { emoji: "😊", bg: "from-yellow-300 to-orange-400", rotate: "-rotate-6" },
  { emoji: "😍", bg: "from-pink-400 to-rose-500", rotate: "rotate-3" },
  { emoji: "😂", bg: "from-amber-300 to-yellow-500", rotate: "-rotate-2" },
  { emoji: "😎", bg: "from-cyan-400 to-blue-500", rotate: "rotate-6" },
  { emoji: "🥳", bg: "from-fuchsia-400 to-purple-500", rotate: "-rotate-3" },
  { emoji: "🔥", bg: "from-orange-400 to-red-500", rotate: "rotate-2" },
  { emoji: "😘", bg: "from-rose-400 to-pink-500", rotate: "-rotate-6" },
  { emoji: "🤯", bg: "from-violet-400 to-indigo-500", rotate: "rotate-3" },
  { emoji: "😴", bg: "from-sky-300 to-blue-400", rotate: "-rotate-2" },
  { emoji: "🤗", bg: "from-emerald-300 to-teal-500", rotate: "rotate-6" },
  { emoji: "✌️", bg: "from-lime-300 to-green-500", rotate: "-rotate-3" },
  { emoji: "🤔", bg: "from-stone-300 to-amber-500", rotate: "rotate-2" },
  { emoji: "😢", bg: "from-blue-300 to-indigo-400", rotate: "-rotate-6" },
  { emoji: "😲", bg: "from-yellow-400 to-amber-500", rotate: "rotate-3" },
  { emoji: "💪", bg: "from-red-400 to-rose-500", rotate: "-rotate-2" },
  { emoji: "👍", bg: "from-green-400 to-emerald-500", rotate: "rotate-6" },
];

const steps = [
  {
    icon: Upload,
    title: "Upload one selfie",
    body: "Drop in a clear front-facing photo. We check it for you — no fiddling.",
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Sparkles,
    title: "Get 4 free previews",
    body: "Our AI cartoons your face in the default style. Streamed in under a minute.",
    accent: "from-amber-400 to-orange-500",
  },
  {
    icon: Send,
    title: "Unlock + install",
    body: "Pay once, pick a style, and we DM you a Telegram pack you actually own.",
    accent: "from-violet-500 to-indigo-500",
  },
];

const features = [
  {
    icon: Heart,
    title: "Unmistakably you",
    body: "Tight prompts and a forgiving cartoon style mean the likeness lands.",
  },
  {
    icon: Zap,
    title: "Ready in ~3 min",
    body: "Sync UX — stick around and watch the pack come to life.",
  },
  {
    icon: MessageCircle,
    title: "Native Telegram pack",
    body: "Real sticker set you own, install link DM'd to you instantly.",
  },
  {
    icon: Palette,
    title: "Pick your style",
    body: "Default style is free in preview; paid users unlock more vibes.",
  },
  {
    icon: RefreshCw,
    title: "One free do-over",
    body: "Not feeling it? Regenerate the whole pack within 7 days, on us.",
  },
  {
    icon: Share2,
    title: "Share anywhere",
    body: "Drop them in TikTok, Instagram, or download as PNG/WebP.",
  },
];

const faqs = [
  {
    q: "How long does it actually take?",
    a: "Previews stream in under a minute. Full pack ships in 1–3 minutes after checkout.",
  },
  {
    q: "What if the stickers look off?",
    a: "Every paid pack includes one free regeneration within 7 days. Refunds for genuinely broken output, no drama.",
  },
  {
    q: "Do I own the pack?",
    a: "Yes. The Telegram sticker set is created under your Telegram account — share it, install it, keep it forever.",
  },
  {
    q: "What about my photo?",
    a: "Stored only as long as your account is. Delete your account from settings and it cascades — photo, pack, gone.",
  },
];

export default function Home() {
  return (
    <div className="relative w-full overflow-x-hidden bg-white text-zinc-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] bg-gradient-to-b from-fuchsia-100 via-amber-50 to-white" />
      <div
        className="pointer-events-none absolute -top-32 -left-24 -z-10 h-[480px] w-[480px] rounded-full bg-fuchsia-300/40 blur-3xl"
        style={{ animation: "drift 14s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -top-20 right-0 -z-10 h-[420px] w-[420px] rounded-full bg-amber-300/40 blur-3xl"
        style={{ animation: "drift 18s ease-in-out infinite reverse" }}
      />

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-zinc-900/5">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-amber-400 text-white shadow-lg shadow-fuchsia-500/30">
              <Sparkles
                className="h-4 w-4"
                style={{ animation: "twinkle 2.4s ease-in-out infinite" }}
              />
            </span>
            Stikup
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
            <a href="#how" className="hover:text-zinc-900 transition">How it works</a>
            <a href="#pack" className="hover:text-zinc-900 transition">Sample pack</a>
            <a href="#pricing" className="hover:text-zinc-900 transition">Pricing</a>
            <a href="#faq" className="hover:text-zinc-900 transition">FAQ</a>
          </div>
          <a
            href="#start"
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
          >
            Open in Telegram
            <Send className="h-3.5 w-3.5" />
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span
              className="reveal inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700"
              style={{ animationDelay: "0ms" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
              New · Sticker pack of YOU, in 3 min
            </span>
            <h1
              className="reveal mt-5 text-5xl font-black leading-[1.05] tracking-tight md:text-7xl"
              style={{ animationDelay: "100ms" }}
            >
              A sticker pack of{" "}
              <span className="relative inline-block">
                <span className="gradient-text bg-gradient-to-r from-fuchsia-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                  YOU
                </span>
                <svg
                  aria-hidden
                  className="absolute -bottom-2 left-0 w-full"
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
                      <stop offset="0" stopColor="#d946ef" />
                      <stop offset="1" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              ,{" "}
              <br className="hidden md:block" />
              in your Telegram.
            </h1>
            <p
              className="reveal mt-6 max-w-md text-lg text-zinc-600"
              style={{ animationDelay: "200ms" }}
            >
              One selfie. Sixteen stickers. Yours to send forever. Stikup turns your face into a
              real Telegram pack — no artist, no Photoshop, no waiting.
            </p>

            <div
              id="start"
              className="reveal mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: "300ms" }}
            >
              <a
                href="#"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-fuchsia-600 to-amber-500 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-fuchsia-500/30 transition hover:shadow-2xl hover:shadow-fuchsia-500/40 hover:-translate-y-0.5"
              >
                <span className="shimmer-btn absolute inset-0" aria-hidden />
                <Camera className="relative h-5 w-5" />
                <span className="relative">Make my stickers</span>
                <ArrowRight
                  className="relative h-4 w-4 transition group-hover:translate-x-1"
                />
              </a>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3.5 text-base font-semibold text-zinc-900 transition hover:bg-zinc-50 hover:-translate-y-0.5"
              >
                See how it works
              </a>
            </div>

            <div
              className="reveal mt-8 flex items-center gap-5 text-sm text-zinc-500"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex -space-x-2">
                {["bg-fuchsia-400", "bg-amber-400", "bg-cyan-400", "bg-emerald-400"].map((c) => (
                  <div
                    key={c}
                    className={`h-8 w-8 rounded-full border-2 border-white ${c}`}
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs">Loved by early testers</span>
              </div>
            </div>
          </div>

          {/* Sticker mosaic */}
          <div className="relative mx-auto h-[420px] w-full max-w-md md:h-[520px]">
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-fuchsia-200/60 via-amber-100/60 to-cyan-200/60 blur-2xl" />
            <div className="relative grid h-full grid-cols-4 grid-rows-4 gap-3 p-4">
              {stickers.map((s, i) => (
                <div
                  key={i}
                  className="grid place-items-center"
                  style={{
                    animation: `pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms both, float 6s ease-in-out ${i * 0.15 + 0.6}s infinite`,
                  }}
                >
                  <div
                    className={`grid h-full w-full place-items-center rounded-2xl bg-gradient-to-br ${s.bg} ${s.rotate} text-3xl shadow-lg ring-4 ring-white transition hover:scale-125 hover:rotate-0 hover:z-10 md:text-4xl`}
                  >
                    {s.emoji}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="absolute -bottom-4 -right-4 rotate-6 rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white shadow-xl"
              style={{ animation: "fade-up 0.6s ease-out 1.2s both" }}
            >
              16 stickers · WebP · 512px
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal max-w-2xl">
            <span className="text-sm font-bold uppercase tracking-wider text-fuchsia-600">
              How it works
            </span>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Three taps from selfie to sticker pack.
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              No prompts to write. No styles to wrangle. The whole flow is built for one-handed
              mobile use — because that&apos;s where Telegram lives.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="reveal group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm transition hover:shadow-xl hover:-translate-y-2"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div
                  className={`absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${step.accent} opacity-10 blur-2xl transition group-hover:opacity-20`}
                />
                <div
                  className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${step.accent} text-white shadow-lg`}
                >
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Step {i + 1}
                </div>
                <h3 className="mt-1 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-zinc-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample pack showcase */}
      <section id="pack" className="py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="reveal order-2 md:order-1">
              <span className="text-sm font-bold uppercase tracking-wider text-amber-600">
                Sample pack
              </span>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Every emotion you actually use.
              </h2>
              <p className="mt-4 text-lg text-zinc-600">
                Sixteen hand-picked emotions and reactions — covering 99% of how you reply on
                Telegram. Curated so you never have to write a prompt.
              </p>

              <ul className="mt-6 grid grid-cols-2 gap-3">
                {[
                  "Happy",
                  "In love",
                  "Laughing",
                  "Cool",
                  "Partying",
                  "Mind blown",
                  "Sleeping",
                  "Crying",
                ].map((e) => (
                  <li
                    key={e}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium"
                  >
                    <Check className="h-4 w-4 text-emerald-500" />
                    {e}
                  </li>
                ))}
              </ul>

              <a
                href="#start"
                className="mt-8 inline-flex items-center gap-2 text-base font-bold text-fuchsia-600 hover:text-fuchsia-700"
              >
                Try the free 4-sticker preview
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="reveal order-1 md:order-2">
              <div className="relative mx-auto max-w-sm">
                <div
                  className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-fuchsia-400 via-pink-400 to-amber-300 opacity-30 blur-2xl"
                  style={{ animation: "drift 12s ease-in-out infinite" }}
                />
                <div className="relative rounded-[2.5rem] border border-zinc-200 bg-white p-5 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">My Stikup Pack</div>
                        <div className="text-[10px] text-zinc-500">t.me/addstickers/...</div>
                      </div>
                    </div>
                    <button className="rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white">
                      Add
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {stickers.map((s, i) => (
                      <div
                        key={i}
                        className={`aspect-square grid place-items-center rounded-xl bg-gradient-to-br ${s.bg} text-2xl shadow-sm`}
                      >
                        {s.emoji}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-zinc-950 py-24 text-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="reveal max-w-2xl">
            <span className="text-sm font-bold uppercase tracking-wider text-amber-400">
              Why Stikup
            </span>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Built for the chat, not for the gallery.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="reveal group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:-translate-y-1"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-amber-400 text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-zinc-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <div className="reveal">
            <span className="text-sm font-bold uppercase tracking-wider text-fuchsia-600">
              Pricing
            </span>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              One pack. One price. No subscription.
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Try the 4-sticker preview free. Pay once to unlock the full pack — keep it forever.
            </p>
          </div>

          <div className="reveal relative mt-12" style={{ animationDelay: "150ms" }}>
            <div
              className="gradient-text absolute -inset-1 rounded-3xl bg-gradient-to-br from-fuchsia-500 via-pink-400 to-amber-400 opacity-70 blur"
              style={{ backgroundSize: "300% 300%" }}
            />
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 text-left shadow-2xl md:p-10">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-fuchsia-700">
                    Full pack
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tight md:text-6xl">$6.99</span>
                    <span className="text-zinc-500">one-time</span>
                  </div>
                </div>
                <a
                  href="#start"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3.5 text-base font-bold text-white transition hover:bg-zinc-800"
                >
                  Unlock the pack
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "16 full-res stickers",
                  "Pick from premium styles",
                  "No Stikup watermark",
                  "1 free regeneration",
                  "Delivered to your Telegram",
                  "PNG + WebP downloads",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-zinc-700">
                    <div className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-zinc-500">
            Stripe · Apple Pay · Google Pay · Regional pricing supported
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-3xl px-5">
          <div className="reveal text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-fuchsia-600">
              FAQ
            </span>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Got questions, we got vibes.
            </h2>
          </div>

          <div className="mt-12 space-y-3">
            {faqs.map((f, i) => (
              <details
                key={f.q}
                className="reveal group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 open:border-fuchsia-300 open:shadow-md"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold text-zinc-900 list-none">
                  {f.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-600 transition group-open:rotate-45 group-open:bg-fuchsia-100 group-open:text-fuchsia-700">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-zinc-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-24">
        <div
          className="gradient-text absolute inset-0 bg-gradient-to-br from-fuchsia-600 via-pink-500 to-amber-400"
          style={{ backgroundSize: "300% 300%" }}
        />
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="reveal relative mx-auto max-w-3xl px-5 text-center text-white">
          <h2 className="text-5xl font-black tracking-tight md:text-6xl">
            Your face. Your pack. Three minutes.
          </h2>
          <p className="mt-5 text-lg text-white/90">
            Upload a selfie. Watch the magic. Send the stickers everywhere.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-7 py-4 text-base font-bold text-zinc-900 shadow-xl transition hover:scale-105"
            >
              <span className="shimmer-btn absolute inset-0" aria-hidden />
              <Camera className="relative h-5 w-5" />
              <span className="relative">Try the free preview</span>
              <ArrowRight className="relative h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Send className="h-5 w-5" />
              Open Telegram bot
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-4 w-4" />
              PNG + WebP downloads
            </span>
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Free do-over included
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              13+ only · GDPR ready
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 text-sm text-zinc-500">
          <div className="flex items-center gap-2 font-bold text-zinc-900">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-amber-400 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            Stikup
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#" className="hover:text-zinc-900">Privacy</a>
            <a href="#" className="hover:text-zinc-900">Terms</a>
            <a href="#" className="hover:text-zinc-900">Support</a>
            <a href="#" className="hover:text-zinc-900">support@stikup.app</a>
          </div>
          <div>© 2026 Stikup</div>
        </div>
      </footer>
    </div>
  );
}
