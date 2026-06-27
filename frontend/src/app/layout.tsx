import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import Script from "next/script";
import { AppHeader } from "@/components/app-header";
import { LanguageProvider } from "@/components/language-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/lib/store/providers";
import { TelegramProvider } from "@/components/telegram/telegram-provider";
import { ReferralCapture } from "@/components/referral-capture";
import { ScrollToTop } from "@/components/scroll-to-top";
import { BrowserGuard } from "@/components/browser-guard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stikup — A sticker pack of YOU, in Telegram",
  description:
    "Turn one selfie into a personalized Telegram sticker pack in under 3 minutes. 3 free stickers, one-time unlock for the full 12-sticker pack.",
};

const noFlashThemeScript = `
(function(){try{
  var t=localStorage.getItem("stikup:theme");
  if(t!=="light")document.documentElement.classList.add("dark");
}catch(e){}})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="no-flash-theme" strategy="beforeInteractive">
          {noFlashThemeScript}
        </Script>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://sad.adsgram.ai/js/sad.min.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-dvh flex flex-col">
        <ThemeProvider>
          <LanguageProvider>
            <StoreProvider>
              <TelegramProvider>
                <BrowserGuard />
                <ScrollToTop />
                <ReferralCapture />
                <AppHeader />
                {children}
              </TelegramProvider>
            </StoreProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
