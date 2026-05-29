import {
  Download,
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Timer,
  Upload,
} from "lucide-react";
import type { ComponentType } from "react";

export type StickerAsset = { src: string; alt: string };

export const ALL_STICKERS: StickerAsset[] = Array.from({ length: 12 }, (_, i) => ({
  src: `/assets/sticker_${i + 1}.webp`,
  alt: `Sticker ${i + 1}`,
}));

export const HERO_STICKERS = [
  { idx: 0, r: -8, t: "5%", l: "0%", d: 0 },
  { idx: 1, r: 6, t: "0%", l: "55%", d: 120 },
  { idx: 2, r: -4, t: "32%", l: "75%", d: 240 },
  { idx: 3, r: 8, t: "60%", l: "62%", d: 360 },
  { idx: 4, r: -10, t: "70%", l: "10%", d: 480 },
  { idx: 5, r: 4, t: "38%", l: "-2%", d: 600 },
] as const;

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

export const STEPS: { icon: IconType; eyebrow: string; title: string; body: string }[] = [
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
    body: "Your full pack of 12 generates upfront. Take the 3 free — refer a friend who signs up to unlock all 12 free, or pay $5 to unlock and get 10 more generations.",
  },
];

export const FEATURES: { icon: IconType; title: string; body: string }[] = [
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

export const FAQS: { q: string; a: string }[] = [
  {
    q: "How does it actually work?",
    a: "You message our Telegram bot. It opens a webpage where you upload one selfie. About 1–3 minutes later, you see all 12 stickers — 3 are free to take, and the other 9 are visibly locked. Refer a friend who signs up to unlock the whole pack free, or pay $5 — the bot installs it to your Telegram.",
  },
  {
    q: "What’s included when I pay?",
    a: "All 12 stickers unlock instantly — no second wait. The bot creates a real Telegram sticker set you own and DMs you the install link. You also get 10 more generations to make new packs or re-roll.",
  },
  {
    q: "Can I make more than one pack?",
    a: "Yes — each pack is a separate purchase. A $5 unlock includes 10 more generations, so you can run new packs without paying again. Referrals also unlock free. No subscription, no surprise charges.",
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
