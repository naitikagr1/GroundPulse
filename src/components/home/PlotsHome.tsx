import Link from "next/link";
import { ArrowRight, Check, LandPlot } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { MapCard } from "@/components/ui/MapCard";
import { START, START_LABEL } from "@/lib/start";

/** Plots & land — same weight as homes, on the home page. */
export function PlotsHome() {
  return (
    <section id="plots" className="section" aria-labelledby="plots-title">
      <div className="wrap">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          <Reveal>
            <div className="card flex h-full flex-col justify-between bg-ink p-7 text-white sm:p-9 md:p-12">
              <div>
                <p className="flex items-center gap-2 text-[16px] font-medium text-white/70"><LandPlot size={16} /> Plots & land</p>
                <h2 id="plots-title" className="t-1 mt-2 max-w-[14ch]">Is anyone sitting on your land?</h2>
                <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-white/75">Empty plots get occupied, fenced, dumped on and built over — quietly, for years. A police-verified inspector walks the full boundary, photographs every corner with GPS, and shows you exactly what's there today. Do it once, or every quarter.</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {["Encroachment & occupation", "Boundary markers & fence", "Neighbour construction / dumping", "Notices, road & utility work", "GPS photo of every corner", "Compare with the last visit"].map((t) => <li key={t} className="flex items-center gap-2.5 text-[14px] text-white/90"><span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white/15"><Check size={11} strokeWidth={3} /></span>{t}</li>)}
                </ul>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="mr-auto"><div className="text-[30px] font-medium leading-none tracking-[-0.04em]">₹1,999 <span className="text-[14px] font-normal text-white/60">per visit</span></div><div className="mt-1 text-[12.5px] text-white/60">Repeat every quarter · cancel anytime · report within the hour</div></div>
                <Link href={START} className="btn btn-white">{START_LABEL} <ArrowRight size={16} /></Link>
                <Link href="/plots" className="btn btn-line text-white">All about plots</Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="card relative h-[420px] overflow-hidden bg-white shadow-card lg:h-full">
              <MapCard className="h-full !rounded-none !shadow-none" />
              <div className="absolute left-4 top-4 max-w-[300px] rounded-[14px] bg-white/95 p-4 shadow-card backdrop-blur"><div className="text-[15px] font-medium">Plot visit · sample</div><div className="t-small mt-1">4 corners GPS-tagged · boundary walk 184 m · "No change vs. last visit"</div><Link href="/sample-report" className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-accent-2 hover:underline">See a plot report <ArrowRight size={12} /></Link></div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
