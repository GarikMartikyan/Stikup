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
import { hasSession } from "@/lib/auth/has-session";

export default async function LandingPage() {
  const loggedIn = await hasSession();

  return (
    <div className="relative w-full overflow-x-hidden text-[var(--color-fg)]">
      <AtmosphericBackdrop />
      <Hero loggedIn={loggedIn} />
      <MarqueeStrip />
      <HowItWorks />
      <PackShowcase loggedIn={loggedIn} />
      <Features />
      <Pricing loggedIn={loggedIn} />
      <Faq />
      <FinalCta loggedIn={loggedIn} />
      <SiteFooter />
    </div>
  );
}
