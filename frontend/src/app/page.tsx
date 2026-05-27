import { AtmosphericBackdrop } from "@/components/landing/atmospheric-backdrop";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { MarqueeStrip } from "@/components/landing/marquee-strip";
import { PackShowcase } from "@/components/landing/pack-showcase";
import { Pricing } from "@/components/landing/pricing";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export default function LandingPage() {
  return (
    <div className="relative w-full overflow-x-hidden text-[var(--color-fg)]">
      <AtmosphericBackdrop />
      <SiteHeader />
      <Hero />
      <MarqueeStrip />
      <HowItWorks />
      <PackShowcase />
      <Features />
      <Pricing />
      <Faq />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
