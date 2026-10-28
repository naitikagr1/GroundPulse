import { Hero } from "@/components/home/Hero";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageLd } from "@/lib/seo";
import { Relax } from "@/components/shared/Relax";
import { Steps } from "@/components/home/Steps";
import { Timeline } from "@/components/home/Timeline";
import { Pricing } from "@/components/home/Pricing";
import { MoreLinks } from "@/components/home/MoreLinks";
import { Story } from "@/components/home/Story";
import { FAQ } from "@/components/home/FAQ";
import { CTA } from "@/components/home/CTA";
import { StickyBar } from "@/components/site/StickyBar";

/**
 * Kept to what a first-time visitor needs: what this is, why to trust it, what
 * it costs, and how to start. Detail lives on its own page — see MoreLinks.
 */
export default function Home() {
  return (
    <>
      <JsonLd data={faqPageLd()} />
      <Hero />
      <Relax />
      <Steps />
      <Timeline />
      <Pricing relax={false} />
      <MoreLinks />
      {/* warm tinted band */}
      <div className="sheet bg-beige pb-16 md:pb-24">
        <Story />
      </div>

      {/* FAQ panel pulls up over the band */}
      <div className="relative z-[1] -mt-10 md:-mt-14">
        <FAQ />
      </div>
      <CTA />
      <StickyBar />
    </>
  );
}
