import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, KeyRound, PlaneLanding, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { EvidenceFrame } from "@/components/ui/EvidenceFrame";
import { comingHome } from "@/lib/pricing";
import { bhkKeys, bhkLabel, inr, tiers } from "@/lib/cleaning";
import { START, START_LABEL } from "@/lib/start";
import { SHOT } from "@/lib/photos";

/** Before / after pair — the proof a cleaning receipt can't give you. */
function BeforeAfter({ variant, room, before, after, srcBefore, srcAfter }: { variant: "kitchen" | "bathroom"; room: string; before: string; after: string; srcBefore?: string | null; srcAfter?: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {([["Before", before, "fail", srcBefore], ["After", after, "pass", srcAfter]] as const).map(([label, time, tone, src]) => (
        <div key={label} className="relative">
          <EvidenceFrame variant={variant} src={src} id="" room={room} time={time} tone={tone} ratio="4 / 3" dense />
          <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${label === "After" ? "bg-accent text-white" : "bg-black/60 text-white"}`}>{label} · {time}</span>
        </div>
      ))}
    </div>
  );
}

const [refresh, deep] = tiers;

export function ComingHome() {
  return (
    <section className="section" aria-labelledby="coming-home-title">
      <div className="wrap">
        <SectionHead
          eyebrow="Coming home"
          title={<span id="coming-home-title">Flying in on Friday? Walk into a house that&rsquo;s ready.</span>}
          lede="Book two or three days before you land. Your inspector checks the place, supervises a full deep clean, and gets anything broken fixed — so the door opens on a home you already know everything about."
        />

        {/* the gap nobody else can close */}
        <Reveal className="mt-8">
          <div className="card grid gap-6 bg-ink p-6 text-white sm:p-8 lg:grid-cols-[1fr_1fr] lg:items-center md:p-10">
            <div>
              <p className="flex items-center gap-2 text-[15px] font-medium text-white/70"><KeyRound size={16} /> Why you can&rsquo;t just book a cleaning app</p>
              <h3 className="t-2 mt-2 max-w-[18ch] text-white">Every cleaning service needs someone at home to let them in.</h3>
              <p className="mt-4 max-w-[48ch] text-[15.5px] leading-relaxed text-white/75">
                That is the one thing you don&rsquo;t have. Someone has to hold the keys, be there at 10 a.m., check the crew actually did the
                work, and tell you the truth about it afterwards. From another country, that person doesn&rsquo;t exist — so the booking never
                gets made, and you land into a dusty flat and lose the first day of your trip to it.
              </p>
              <ul className="mt-5 grid gap-2">
                {[
                  "Your inspector handles entry — nobody from your family needs to be there",
                  "A police-verified inspector on site the whole time the crew is working",
                  "Before and after photographs of every room, in the same report",
                  "Anything broken is found, quoted and fixed before you arrive",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[14px] text-white/90">
                    <span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white/15"><Check size={11} strokeWidth={3} /></span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-3">
              <BeforeAfter variant="kitchen" room="Kitchen" before="11:14" after="15:40" srcBefore={SHOT.kitchenDirty} srcAfter={SHOT.kitchen} />
              <BeforeAfter variant="bathroom" room="Bathroom 1" before="11:52" after="15:44" srcBefore={SHOT.bathLeak} srcAfter={SHOT.bathFixed} />
              <p className="text-[12.5px] text-white/55">
                Every room photographed from the same angle before the crew starts and after they finish — so you can judge the work
                yourself instead of taking a completion tick on faith. <span className="text-white/40">Example photos; your report has your own.</span>
              </p>
            </div>
          </div>
        </Reveal>

        {/* the timeline */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <div className="card h-full bg-white p-6 shadow-card sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[16px] font-medium"><PlaneLanding size={17} className="text-accent" /> How the few days before you land go</span>
                <span className="chip chip-accent">{comingHome.lead}</span>
              </div>
              <ol className="mt-6 space-y-5">
                {comingHome.steps.map((s, i) => (
                  <li key={s.t} className="flex gap-4">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-[12px] text-accent-2">{i + 1}</span>
                    <div>
                      <div className="text-[15px] font-medium">{s.t}</div>
                      <p className="t-small mt-1 text-[14px] leading-relaxed">{s.b}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          {/* the deep clean, priced by the size of the home */}
          <Reveal delay={0.08}>
            <div className="card flex h-full flex-col bg-white p-6 shadow-card sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Sparkles size={18} /></span>
                <div>
                  <div className="text-[16px] font-medium">{deep.name}</div>
                  <div className="text-[12.5px] text-text-2">{deep.hours["2"]} · {deep.crew["2"]} + inspector</div>
                </div>
              </div>
              <p className="t-small mt-3 text-[14px]">{deep.tagline} Room by room, with your inspector on site for every hour of it:</p>
              <ul className="mt-4 space-y-2">
                {deep.does.map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                    <span className="mt-[3px] grid h-[16px] w-[16px] shrink-0 place-items-center rounded-full bg-accent-soft text-accent-2"><Check size={10} strokeWidth={3} /></span>{t}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-[14px] bg-paper p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium">All in, by size</span>
                  <span className="text-[12px] text-text-3">inspector &amp; report included</span>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-1.5 text-center">
                  {bhkKeys.map((k) => (
                    <div key={k} className="rounded-[9px] bg-white px-1 py-2 shadow-card">
                      <div className="text-[11px] text-text-2">{bhkLabel[k]}</div>
                      <div className="text-[13px] font-medium tabular-nums">{inr(deep.price[k])}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-[12px] leading-relaxed text-text-2">Chimney, fridge, microwave, cabinet interiors and sofa shampoo are itemised, not assumed — you pick them before you pay.</p>
              </div>
              <div className="mt-auto pt-5">
                <Link href={START} className="btn btn-accent w-full">{START_LABEL} <ArrowRight size={16} /></Link>
                <Link href="/cleaning" className="mt-2 flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-accent-2 hover:underline">
                  See every room, every step and every price <ArrowRight size={13} />
                </Link>
                <p className="mt-1.5 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-text-2">
                  <BadgeCheck size={13} className="text-accent" /> Inspection + deep clean from {inr(comingHome.from)}
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* the lighter tier, so nobody buys the wrong one */}
        <Reveal className="mt-4">
          <div className="card flex flex-col gap-4 bg-beige p-5 sm:flex-row sm:items-center sm:p-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-accent shadow-card"><Sparkles size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[15.5px] font-medium">Not coming home &mdash; just want it kept decent? {refresh.name}, from {inr(refresh.price["1"])}.</div>
              <p className="t-small mt-1 text-[13.5px]">{refresh.tagline} {refresh.hours["2"]} for a {bhkLabel["2"]} at {inr(refresh.price["2"])}, up to {inr(refresh.price["5"])} for a {bhkLabel["5"]} &mdash; inspector included on both. Two of them come free every year on Care and Care+.</p>
            </div>
            <Link href="/cleaning" className="btn btn-white btn-sm shrink-0">Compare the two <ArrowRight size={15} /></Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
