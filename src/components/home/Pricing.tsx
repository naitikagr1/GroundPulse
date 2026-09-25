"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Car, Check, Home, LandPlot, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { addOns, assets, inr, plans, plotPlans, visitCovers, visitUseCases } from "@/lib/pricing";
import { Relax } from "@/components/shared/Relax";
import { cn } from "@/lib/cn";
import { bhkKeys, bhkLabel, coverage, tiers as cleanTiers } from "@/lib/cleaning";
import { FoundingOffer } from "@/components/home/FoundingOffer";

const assetIcon = { home: Home, plot: LandPlot, car: Car } as const;
const addOnIcon = { cleaning: Sparkles, deep: Sparkles, car: Car, plot: LandPlot } as const;

type Tab = "home" | "clean" | "plot";
const tabNote: Record<Tab, string> = {
  home: "Apartments, villas, independent houses · one visit or a year of them",
  clean: "Refresh or deep, 1 to 5 BHK · the inspector is in the price, not on top of it",
  plot: "Empty plots, farmland, ancestral land · any size",
};

/* `relax` is off on the homepage, which already carries the same "Why you can
   relax" block directly under the hero — two copies on one page reads as
   padding rather than reassurance. */
export function Pricing({ full, relax = true }: { full?: boolean; relax?: boolean }) {
  const [tab, setTab] = useState<Tab>("home");
  const list = tab === "home" ? plans : tab === "plot" ? plotPlans : [];
  return (
    <section id="pricing" className="section" aria-labelledby="pricing-title">
      <div className="wrap">
        <SectionHead
          title={<span id="pricing-title">Simple pricing. No surprises.</span>}
          lede="Start with a one-time visit or pick a yearly plan. Every visit is by a verified inspector who stays for the whole job — however long it takes. No brokerage. No hidden commission — just 15% on repairs, shown before you approve."
          action={!full ? <Link href="/pricing" className="btn btn-white btn-sm">Full pricing <ArrowRight size={15} /></Link> : undefined}
        />

        <div className="mt-10"><FoundingOffer /></div>

        {/* what we inspect */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {assets.map((a, i) => {
            const I = assetIcon[a.id as keyof typeof assetIcon];
            return (
              <Reveal key={a.id} delay={i * 0.05}>
                <div className="card flex h-full items-start gap-4 bg-white p-5 shadow-card">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={19} /></span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1"><span className="text-[16px] font-medium">{a.name}</span><span className="chip chip-accent">{a.from}</span></div>
                    <p className="t-small mt-1">{a.b}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* homes / plots toggle */}
        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between md:mt-12">
          <div className="inline-flex w-full rounded-[14px] bg-beige p-1 sm:w-auto" role="tablist" aria-label="Plan type">
            {([["home", "Inspections", Home], ["clean", "Cleaning", Sparkles], ["plot", "Plots & land", LandPlot]] as const).map(([k, l, I]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[11px] px-2 text-[13.5px] font-medium transition sm:flex-none sm:px-4 sm:text-[15px]", tab === k ? "bg-white text-ink shadow-card" : "text-text-2 hover:text-ink")}>
                <I size={16} className="hidden sm:block" /> {l}
              </button>
            ))}
          </div>
          <p className="t-small">{tabNote[tab]}</p>
        </div>
        <div className={cn("swipe mt-6 grid gap-4 lg:gap-5", tab === "home" ? "lg:grid-cols-3" : tab === "clean" ? "lg:grid-cols-2" : "lg:grid-cols-[1fr_1.5fr]")}>
          {tab === "clean" && cleanTiers.map((t, i) => {
            const lead = i === 1;
            return (
              <Reveal key={t.id} delay={i * 0.07}>
                <article className={cn("card relative flex h-full flex-col p-6 sm:p-7", lead ? "bg-accent text-white shadow-float lg:-my-3 lg:py-10" : "bg-white shadow-card")}>
                  {lead && <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-1 text-[12px] font-medium text-ink shadow-card">Most booked</span>}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[20px] font-medium tracking-[-0.02em]">{t.name}</h3>
                      <p className={cn("mt-1 text-[14px]", lead ? "text-white/80" : "text-text-2")}>{t.tagline}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium", lead ? "bg-white/15 text-white" : "bg-accent-soft text-accent-2")}>inspector included</span>
                  </div>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-[40px] font-medium leading-none tracking-[-0.04em] sm:text-[44px]">{inr(t.price["1"])}</span>
                    <span className={cn("text-[14px]", lead ? "text-white/75" : "text-text-2")}>1 BHK, all in</span>
                  </div>
                  <p className={cn("mt-1 text-[13px]", lead ? "text-white/70" : "text-text-2")}>{t.hours["2"]} for a {bhkLabel["2"]} · {t.crew["2"]} + inspector</p>
                  <ul className="mt-6 space-y-2.5">
                    {t.does.slice(0, 5).map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-[14.5px] leading-snug">
                        <span className={cn("mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full", lead ? "bg-white text-accent-2" : "bg-accent-soft text-accent-2")}><Check size={11} strokeWidth={3} /></span>
                        <span className={lead ? "text-white/90" : "text-text"}>{d}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 grid grid-cols-5 gap-1.5 text-center">
                    {bhkKeys.map((k) => (
                      <div key={k} className={cn("rounded-[10px] px-1 py-2", lead ? "bg-white/12" : "bg-beige")}>
                        <div className={cn("text-[11px]", lead ? "text-white/70" : "text-text-2")}>{bhkLabel[k]}</div>
                        <div className="text-[13px] font-medium tabular-nums">{inr(t.price[k])}</div>
                      </div>
                    ))}
                  </div>
                  <p className={cn("mt-2 text-[12px]", lead ? "text-white/60" : "text-text-3")}>
                    {coverage["3"].bed} bed · {coverage["3"].bath} bath · {coverage["3"].balcony} balcony on a 3 BHK, plus living and kitchen. Or add it to a visit you already have for +{inr(t.rider["3"])}.
                  </p>
                  <div className="mt-auto pt-5">
                    <Link href="/access" className={cn("btn w-full", lead ? "btn-white" : "btn-accent")}>Join the waitlist <ArrowRight size={16} /></Link>
                    <Link href="/cleaning" className={cn("mt-2 flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium hover:underline", lead ? "text-white/85" : "text-accent-2")}>
                      How we clean, room by room <ArrowRight size={13} />
                    </Link>
                  </div>
                </article>
              </Reveal>
            );
          })}
          {list.map((p, i) => (
            <Reveal key={`${tab}-${p.id}`} delay={i * 0.07}>
              <article className={cn("card relative flex h-full flex-col p-6 sm:p-7", p.popular ? "bg-accent text-white shadow-float lg:-my-3 lg:py-10" : "bg-white shadow-card")}>
                {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-1 text-[12px] font-medium text-ink shadow-card">Most popular</span>}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[20px] font-medium tracking-[-0.02em]">{p.name}</h3>
                    <p className={cn("mt-1 text-[14px]", p.popular ? "text-white/80" : "text-text-2")}>{p.tagline}</p>
                  </div>
                  {p.worth && <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium", p.popular ? "bg-white/15 text-white" : "bg-accent-soft text-accent-2")}>{p.worth}</span>}
                </div>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-[40px] font-medium leading-none tracking-[-0.04em] sm:text-[44px]">{inr(p.price)}</span>
                  <span className={cn("text-[14px]", p.popular ? "text-white/75" : "text-text-2")}>{p.period}</span>
                </div>
                <p className={cn("mt-1 text-[13px]", p.popular ? "text-white/70" : "text-text-2")}>{p.price3 ? "Up to 2 BHK" : ""}{p.period === "per year" ? `${p.price3 ? " · " : ""}≈ ${inr(Math.round(p.price / 12))} a month` : ""}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.includes.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-[14.5px] leading-snug">
                      <span className={cn("mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full", p.popular ? "bg-white text-accent-2" : "bg-accent-soft text-accent-2")}><Check size={11} strokeWidth={3} /></span>
                      <span className={p.popular ? "text-white/90" : "text-text"}>{t}</span>
                    </li>
                  ))}
                </ul>
                {p.id === "care-plus" && <Link href="/pricing#cover-terms" className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent-2 hover:underline">See exactly what the cover includes <ArrowRight size={12} /></Link>}
                {p.price3 && (
                  <div className={cn("mt-6 grid grid-cols-2 gap-2 text-[13px]", "")}>
                    <div className={cn("rounded-[12px] px-3.5 py-2.5", p.popular ? "bg-white/12" : "bg-beige")}><div className={cn("text-[11.5px]", p.popular ? "text-white/70" : "text-text-2")}>3 BHK</div><div className="font-medium">{inr(p.price3)}{p.period === "per year" ? "/yr" : ""}</div></div>
                    <div className={cn("rounded-[12px] px-3.5 py-2.5", p.popular ? "bg-white/12" : "bg-beige")}><div className={cn("text-[11.5px]", p.popular ? "text-white/70" : "text-text-2")}>4 BHK+</div><div className="font-medium">{inr(p.price4 ?? p.price3)}{p.period === "per year" ? "/yr" : ""}</div></div>
                  </div>
                )}
                <Link href="/access" className={cn("btn mt-4 w-full", p.popular ? "btn-white" : "btn-accent")}>{p.cta} <ArrowRight size={16} /></Link>
              </article>
            </Reveal>
          ))}
          {tab === "plot" && (
            <Reveal delay={0.1}>
              <div className="card flex h-full flex-col justify-center bg-ink p-6 text-white sm:p-8 md:p-10">
                <p className="text-[16px] font-medium text-white/70">Why owners book it</p>
                <h3 className="t-2 mt-1 max-w-[16ch]">Is anyone sitting on your land?</h3>
                <p className="mt-3 max-w-[46ch] text-[15.5px] leading-relaxed text-white/75">Empty plots get occupied, fenced, dumped on and built over — quietly, for years. A verified inspector walks the boundary, photographs every corner with GPS, and shows you exactly what's there today.</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {["Encroachment & occupation", "Boundary markers & fence", "Neighbour construction / dumping", "Notices, road & utility work", "GPS photo of every corner", "Photo map in your report"].map((t) => <li key={t} className="flex items-center gap-2.5 rounded-[10px] bg-white/[0.07] px-3 py-2 text-[13.5px]"><span className="grid h-[16px] w-[16px] shrink-0 place-items-center rounded-full bg-white/15"><Check size={10} strokeWidth={3} /></span>{t}</li>)}
                </ul>
                <p className="mt-5 text-[13px] text-white/60">Same ₹1,999 as a home visit. Book it once, or every quarter — your call.</p>
              </div>
            </Reveal>
          )}
        </div>

        {/* add-ons */}
        <Reveal className="mt-8">
          <div className="card bg-beige p-5 sm:p-7">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div><div className="text-[18px] font-medium tracking-[-0.02em]">Add-ons — on any plan, any visit</div><div className="t-small">Book with a visit, or on their own in between. Cleaning prices are all-in and include the inspector — and cost less when added to an inspection you've already booked, because the inspector is already there.</div></div>
              <Link href="/cleaning" className="btn btn-white btn-sm shrink-0">See the cleaning in full <ArrowRight size={15} /></Link>
            </div>
            <div className="swipe mt-5 grid gap-3 [--swipe-bleed:1.25rem] sm:grid-cols-3">
              {addOns.map((a) => {
                const I = addOnIcon[a.id as keyof typeof addOnIcon];
                return (
                  <Link key={a.id} href={a.id === "cleaning" || a.id === "deep" ? "/cleaning" : "/access"} className="card group flex items-start gap-3 bg-white p-4 shadow-card transition hover:-translate-y-0.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={17} /></span>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2"><span className="text-[15px] font-medium">{a.name}</span></div>
                      <div className="text-[20px] font-medium leading-tight tracking-[-0.03em]">{inr(a.price)} <span className="text-[12.5px] font-normal text-text-2">{a.unit}</span></div>
                      <div className="t-small mt-1">{a.note}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* supervised work */}
        <Reveal className="mt-4">
          <div className="card flex flex-col gap-4 bg-accent p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15"><ShieldCheck size={19} /></span>
              <div>
                <div className="text-[17px] font-medium">Cleaning and repairs happen during the visit — with your inspector in the room.</div>
                <p className="mt-1 max-w-[62ch] text-[14px] leading-relaxed text-white/80">Nothing happens behind your back. The cleaning crew or the repair pro works during a scheduled visit while your verified inspector stays on-site the whole time — and the before/after photos land in the same report. Repairs are always the pro's quote + a 15% fee, approved by you. No brokerage, no hidden commission.</p>
              </div>
            </div>
          </div>
        </Reveal>

        {relax && (
          <Reveal className="mt-4">
            <div className="card bg-beige p-5 sm:p-7">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div className="text-[18px] font-medium tracking-[-0.02em]">Why you can relax</div>
                <div className="t-small max-w-[60ch]">Repairs are always the verified pro's quote + a 15% fee, approved by you. No brokerage, no hidden commission.</div>
              </div>
              <Relax variant="list" className="mt-5 sm:grid-cols-2" />
            </div>
          </Reveal>
        )}

        {full && (
          <>
            {/* what a one-time visit covers */}
            <div className="mt-16 grid gap-8 md:mt-20 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-5">
                <Reveal>
                  <p className="text-[18px] font-medium text-text-2">One-time visit · {inr(1999)}</p>
                  <h3 className="t-1 mt-1 max-w-[14ch]">What one visit actually covers</h3>
                  <p className="t-body mt-4 max-w-[44ch] text-text-2">Not a walk-around and a vibe. A structured checklist, proof on every item, and a report in your inbox within the hour.</p>
                  <div className="mt-5 flex flex-wrap gap-2">{visitUseCases.map((u) => <span key={u} className="chip">{u}</span>)}</div>
                  <Link href="/access" className="btn btn-accent mt-7">Join the waitlist <ArrowRight size={16} /></Link>
                </Reveal>
              </div>
              <Reveal className="lg:col-span-7">
                <ul className="card grid gap-3 bg-white p-6 shadow-card sm:grid-cols-2 sm:p-7">
                  {visitCovers.map((c) => <li key={c} className="flex items-start gap-2.5 text-[14.5px]"><span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-accent-soft text-accent-2"><Check size={11} strokeWidth={3} /></span>{c}</li>)}
                </ul>
              </Reveal>
            </div>

          </>
        )}
      </div>
    </section>
  );
}
