import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { serviceLd } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHead } from "@/components/shared/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { CleanMethod } from "@/components/cleaning/CleanMethod";
import { CleanCompare, CleanCrew, CleanIncluded, CleanKit, CleanPrices, CleanWall, ComingBack } from "@/components/cleaning/CleanDetails";
import { FAQ } from "@/components/home/FAQ";
import { CTA } from "@/components/home/CTA";
import { inr, tiers } from "@/lib/cleaning";
import { START, START_LABEL } from "@/lib/start";

export const metadata: Metadata = {
  title: "Home Cleaning When Nobody Is Home",
  description:
    "Refresh clean from ₹1,999, deep clean from ₹4,999. Our inspector lets the crew in once you confirm, stays the whole time and sends before/after photos.",
  alternates: { canonical: "/cleaning" },
  openGraph: { title: "Home Cleaning When Nobody Is Home | StillYours", description: "Refresh clean from ₹1,999, deep clean from ₹4,999. Our inspector lets the crew in once you confirm, stays the whole time and sends before/after photos.", url: "/cleaning" },
};

const [refresh, deep] = tiers;

export default function Page() {
  return (
    <>
      <JsonLd data={serviceLd({ name: "Home cleaning with a verified inspector on site", serviceType: "House cleaning", path: "/cleaning", description: "Refresh or deep clean priced by the size of the home, with a verified inspector present for the whole job and before-and-after photographs of every room." })} />
      <PageHero
        eyebrow="Cleaning"
        title={<>A clean house,<br className="hidden md:block" /> with nobody at home.</>}
        lede="Two honest tiers, priced by the size of the home. A verified inspector goes in once you confirm, stays the entire time the crew works, photographs every room before and after, and sends you the condition report within the hour."
      >
        <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {[
            `${refresh.name} from ${inr(refresh.price["1"])}`,
            `${deep.name} from ${inr(deep.price["1"])}`,
            "Inspector included, not extra",
            "1 to 5 BHK",
          ].map((c) => (
            <span key={c} className="rounded-full bg-white px-4 py-2 text-[13.5px] font-medium shadow-card">{c}</span>
          ))}
        </Reveal>
        <Reveal delay={0.16} className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href={START} className="btn btn-accent">{START_LABEL} <ArrowRight size={16} /></Link>
          <Link href="#prices" className="btn btn-white">See every price</Link>
        </Reveal>
      </PageHero>

      {/* why anybody books this */}
      <section className="section" aria-labelledby="back-title">
        <div className="wrap">
          <SectionHead
            eyebrow="Coming back"
            title={<span id="back-title">Two years shut. One visit to put it right.</span>}
            lede="A deep clean is rarely about dust. It's about a door that hasn't opened in a long time, a trip that starts on Friday, and nobody on the ground to sort it out before you get there."
          />
          <div className="mt-8"><ComingBack /></div>
        </div>
      </section>

      {/* every price, read-only */}
      <section id="prices" className="section pt-0" aria-labelledby="prices-title">
        <div className="wrap">
          <SectionHead
            eyebrow="Prices"
            title={<span id="prices-title">Every number, before you start.</span>}
            lede="Both tiers, all five sizes, and every single thing that can be added — on one screen. You pick what you want in the quote; nothing appears at the door."
            action={<Link href={START} className="btn btn-accent btn-sm">{START_LABEL} <ArrowRight size={15} /></Link>}
          />
          <div className="mt-8"><CleanPrices /></div>
        </div>
      </section>

      {/* which one do you need */}
      <section className="section pt-0" aria-labelledby="compare-title">
        <div className="wrap">
          <SectionHead
            eyebrow="Refresh or deep"
            title={<span id="compare-title">The difference, line by line.</span>}
            lede="A house that has simply been shut for four months needs dust removed, not grease. That is a genuinely cheaper job and we price it as one — so here is exactly where the two part ways."
          />
          <div className="mt-8"><CleanCompare /></div>
        </div>
      </section>

      {/* the method */}
      <section className="section pt-0" aria-labelledby="method-title">
        <div className="wrap">
          <SectionHead
            eyebrow="How we clean"
            title={<span id="method-title">Room by room, in the order it has to be done.</span>}
            lede="Cleaning is mostly method and dwell time — which is why a rushed crew can never fake it, and why the photographs matter more than the promise. Here is the whole process, so you can check the work against it from anywhere."
          />
          <div className="mt-8"><CleanMethod /></div>
        </div>
      </section>

      {/* the wall of proof */}
      <section className="section pt-0" aria-labelledby="wall-title">
        <div className="wrap">
          <SectionHead
            eyebrow="See the difference"
            title={<span id="wall-title">Drag the slider to compare before and after.</span>}
            lede="Thirteen surfaces a deep clean has to get right, each shown from the same angle before and after. This is the standard the crew is measured against — and from your first visit these are replaced by photographs of your own rooms."
          />
          <div className="mt-8"><CleanWall /></div>
        </div>
      </section>

      {/* in / out */}
      <section className="section pt-0" aria-labelledby="scope-title">
        <div className="wrap">
          <SectionHead
            eyebrow="Scope"
            title={<span id="scope-title">Everything in, everything out.</span>}
            lede="The second list is the one that tells you whether a company is being straight with you. Ours is on the same page as the price."
          />
          <div className="mt-8"><CleanIncluded /></div>
        </div>
      </section>

      {/* who does what */}
      <section className="section pt-0">
        <div className="wrap"><CleanCrew /></div>
      </section>

      {/* the positioning */}
      <section className="section pt-0">
        <div className="wrap"><CleanKit /></div>
      </section>

      <FAQ />
      <CTA title="Book the clean before you land" lede="Two or three days before you arrive is ideal — enough time for anything the inspector finds to be quoted, approved and repaired before you open the door." />
    </>
  );
}
