import { AtmosphericBackdrop } from "@/components/landing/atmospheric-backdrop";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { MarqueeStrip } from "@/components/landing/marquee-strip";
import { PackShowcase } from "@/components/landing/pack-showcase";
import { SiteFooter } from "@/components/landing/site-footer";
import { hasSession } from "@/lib/auth/has-session";

export default async function LandingPage() {
  const loggedIn = await hasSession();

  return (
    <div className="relative w-full overflow-x-hidden text-[var(--color-fg)]">
      <AtmosphericBackdrop />
      <Hero loggedIn={loggedIn} />
      <MarqueeStrip />
      <PackShowcase loggedIn={loggedIn} />
      <Features />
      <FinalCta loggedIn={loggedIn} />
      <SiteFooter />
    </div>
  );
}
