import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { serviceLd } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, Check, Clock, Fence, MapPinned, ShieldCheck, Video } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHead } from "@/components/shared/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { MapCard } from "@/components/ui/MapCard";
import { Relax } from "@/components/shared/Relax";
import { FAQ } from "@/components/home/FAQ";
import { CTA } from "@/components/home/CTA";
import { START, START_LABEL } from "@/lib/start";

export const metadata: Metadata = {
  title: "Plot & Land Inspection in Bengaluru, ₹1,999",
  description:
    "We walk your plot's full boundary, photograph every corner with GPS, and flag encroachment or new construction. Report within an hour. ₹1,999 a visit.",
  alternates: { canonical: "/plots" },
  openGraph: { title: "Plot & Land Inspection in Bengaluru, ₹1,999 | StillYours", description: "We walk your plot's full boundary, photograph every corner with GPS, and flag encroachment or new construction. Report within an hour. ₹1,999 a visit.", url: "/plots" },
};

const steps = [
  { I: MapPinned, t: "Tell us where it is", b: "Survey number or pin, size, and where the corners are if you know. A photo of the sale deed sketch helps." },
  { I: ShieldCheck, t: "A verified inspector walks it", b: "Full boundary walk with GPS track, a photo and short video at every corner, fence, gate and signboard." },
  { I: Video, t: "Report within the hour", b: "Photo map, corner-by-corner status, 'no change' vs. last visit — or exactly what changed, with proof." },
  { I: Clock, t: "Repeat every quarter", b: "Set it to repeat. We remind you, walk it, and compare with the last visit. Move or cancel free until the day before." },
];
const worries = [
  ["Someone has built a shed or parked on it", "Unauthorised occupation — the #1 way plots are lost. We photograph it and tell you the same day."],
  ["The neighbour's wall has moved", "Boundary markers photographed with GPS every visit, so a shift is visible and dated."],
  ["It's become a dumping ground", "Debris, construction waste, garbage — flagged with photos so you can act before it 'belongs' there."],
  ["A notice went up and nobody told me", "Acquisition, road-widening, utility work, khata notices — we read them and photograph them."],
  ["The fence and signboard are gone", "Fence, gate and 'private property' board checked every visit. Add a signboard install if needed."],
  ["I have no dated proof it's mine and untouched", "Every visit is a GPS- and time-stamped record — the evidence timeline that matters if you ever need it."],
];

export default function Page() {
  return (
    <>
      <JsonLd data={serviceLd({ name: "Plot and land inspection", serviceType: "Land inspection", path: "/plots", description: "A full boundary walk with a GPS track, photos and video at every corner, fence, gate and signboard, and a flag on any encroachment or unauthorised construction." })} />
      <PageHero eyebrow="Plots & land" title={<>Your land, walked every quarter.<br className="hidden md:block" /> Proof of every corner.</>} lede="Empty plots get occupied, fenced, dumped on and built over — quietly, for years. A police-verified inspector walks the boundary, photographs every corner with GPS, and shows you exactly what's there today.">
        <Reveal delay={0.1} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={START} className="btn btn-accent">{START_LABEL} <ArrowRight size={16} /></Link>
          <Link href="/sample-report" className="btn btn-white">See a plot report</Link>
        </Reveal>
        <p className="mt-4 text-[13.5px] text-text-2">Report within the hour · repeat every quarter · cancel free until the day before · live in Bengaluru</p>
      </PageHero>

      <section className="wrap mt-6 grid gap-4 md:mt-8 lg:grid-cols-[1fr_1.2fr]">
        <Reveal><div className="card relative h-[380px] overflow-hidden bg-white shadow-card lg:h-full"><MapCard className="h-full !rounded-none !shadow-none" /><div className="absolute left-4 top-4 rounded-[12px] bg-white/95 px-3.5 py-2.5 text-[13px] shadow-card backdrop-blur"><span className="font-medium">Live in Bengaluru</span> · Yelahanka, Devanahalli, Whitefield, Sarjapur</div></div></Reveal>
        <Reveal delay={0.08}>
          <ol className="swipe grid gap-3 sm:grid-cols-2">
            {steps.map(({ I, t, b }, i) => <li key={t} className="card bg-white p-5 shadow-card"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><I size={18} /></span><span className="text-[13px] font-medium text-text-2">0{i + 1}</span></div><div className="mt-4 text-[16px] font-medium">{t}</div><p className="t-small mt-1.5 text-[14px]">{b}</p></li>)}
          </ol>
        </Reveal>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead title="Every worry you have about that plot" lede="We've heard all of these from owners 2,000 km away. Each one is a line on the checklist." />
          <div className="swipe mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {worries.map(([t, b], i) => <Reveal key={t} delay={i * 0.04}><div className="card h-full bg-white p-6 shadow-card"><div className="text-[16px] font-medium leading-snug">"{t}"</div><p className="t-small mt-2 text-[14px]">{b}</p></div></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section pt-0 md:pt-0">
        <div className="wrap">
          <Reveal>
            <div className="card grid gap-8 bg-ink p-6 text-white sm:p-10 md:grid-cols-[1fr_1fr] md:items-center md:p-14">
              <div>
                <p className="text-[16px] font-medium text-white/70">Pricing · plots</p>
                <div className="mt-2 flex items-baseline gap-2"><span className="text-[44px] font-medium leading-none tracking-[-0.04em]">₹1,999</span><span className="text-[15px] text-white/65">per visit · any size</span></div>
                <ul className="mt-5 space-y-2 text-[14.5px] text-white/90">
                  {["Full boundary walk, GPS track attached", "Photo + video at every corner, fence, gate, signboard", "Encroachment, construction, dumping, notices checked", "Report within the hour with a photo map", "'No change' vs. last visit, or exactly what changed", "Repeat every quarter — cancel anytime · Prepay 4 for ₹6,999"].map((t) => <li key={t} className="flex items-start gap-2.5"><span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white/15"><Check size={11} strokeWidth={3} /></span>{t}</li>)}
                </ul>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Link href={START} className="btn btn-white">{START_LABEL} <ArrowRight size={16} /></Link><Link href="/sample-report" className="btn btn-line text-white">See a plot report</Link></div>
              </div>
              <div className="grid gap-3">
                {[[Fence, "Found something?", "Signboard install, fencing, boundary marking or a lawyer's notice — verified pros, quote + 15%, you approve."], [ShieldCheck, "Same trust chain as homes", "Police-verified inspector, GPS + time on every photo, and we fix what we damage."], [Clock, "Report within the hour", "Boundary walk, photo map and every corner — in your inbox the same morning."]].map(([I, t, b]) => { const Icon = I as typeof Fence; return <div key={t as string} className="flex gap-3 rounded-[14px] bg-white/[0.07] p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10"><Icon size={16} /></span><div><div className="text-[15px] font-medium">{t as string}</div><div className="mt-1 text-[13px] text-white/65">{b as string}</div></div></div>; })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Relax />
      <div className="h-10 md:h-16" />
      <FAQ />
      <CTA title="Book your first plot visit" lede="Tell us where it is and we'll walk it this week. Report within the hour, with a photo map of every corner." />
    </>
  );
}
