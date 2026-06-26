import {
  Download,
  Gift,
  Heart,
  Palette,
  Send,
  Upload,
  UploadCloud,
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
    icon: Palette,
    eyebrow: "01",
    title: "Pick a style",
    body: "Choose from 8 art styles — Chibi, Disney 3D, Anime, Ghibli, and more. We build the ChatGPT prompt for you.",
  },
  {
    icon: UploadCloud,
    eyebrow: "02",
    title: "Generate in ChatGPT",
    body: "Paste the prompt and your photo into ChatGPT. It returns one image — a 4×3 grid of 12 stickers on a green background.",
  },
  {
    icon: Upload,
    eyebrow: "03",
    title: "Upload the grid",
    body: "Come back and upload the grid image. Our splitter cuts and cleans all 12 stickers automatically.",
  },
  {
    icon: Gift,
    eyebrow: "04",
    title: "Get your pack",
    body: "3 stickers are free. Refer one friend who signs up and all 12 unlock — the bot installs your full pack to Telegram.",
  },
];

export const FEATURES: { icon: IconType; title: string; body: string }[] = [
  {
    icon: Palette,
    title: "8 art styles",
    body: "Chibi, Disney 3D, Anime, Ghibli, Comic, Pixel, Clay, Pop Art. Pick the one that fits your vibe.",
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
    a: "You choose an art style, copy a ready-made prompt, open ChatGPT and paste the prompt with your photo. ChatGPT returns one image — a 4×3 grid of 12 stickers. You upload that grid here; we split, clean, and deliver the stickers to your Telegram.",
  },
  {
    q: "Do I need a paid ChatGPT subscription?",
    a: "ChatGPT's free tier can generate images. If you hit a generation limit you may need ChatGPT Plus, but that's a separate service — Stikup itself is always free.",
  },
  {
    q: "How do I unlock all 12 stickers?",
    a: "Refer one friend who signs up to Stikup. Once they register, all 12 of your stickers unlock automatically — no payment, no subscription.",
  },
  {
    q: "What about my photo?",
    a: "Your uploaded grid image is stored only while your account exists. Delete your account from Settings and everything is removed. GDPR-ready from day one.",
  },
  {
    q: "Why are 9 stickers locked instead of just hidden?",
    a: "So you can see exactly what you'd be unlocking. The locked previews are the real split stickers — visible, with a small lock badge on top. A referral flips the badge off and installs all 12 to your Telegram.",
  },
];
