import Link from "next/link";
import { ArrowRight, CalendarClock, Check, ClipboardList, DoorOpen, Info, KeyRound, Minus, Package, Sparkles, Users, X } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { PhoneMore } from "@/components/ui/PhoneMore";
import { cn } from "@/lib/cn";
import { bhkKeys, bhkLabel, bringVsNeed, coverage, compare, crew, excluded, extraGroups, fulfilment, included, inr, notes, shotWall, tiers } from "@/lib/cleaning";
import { BeforeAfter } from "./Shots";
import { START, START_LABEL } from "@/lib/start";

const refresh = tiers[0];
const deep = tiers[1];

/* "2 bed · 2 bath · 2 balcony" — the standard scope for a size. */
const coverageLine = (k: (typeof bhkKeys)[number]) => {
  const c = coverage[k];
  return `${c.bed} bed · ${c.bath} bath · ${c.balcony} balcony · living · kitchen`;
};

function Cell({ v, strong }: { v: string | boolean; strong?: boolean }) {
  if (v === true) return <span className={cn("mx-auto grid h-[20px] w-[20px] place-items-center rounded-full", strong ? "bg-accent text-white" : "bg-pass-soft text-[#157a44]")}><Check size={12} strokeWidth={3} /></span>;
  if (v === false) return <span className="mx-auto grid h-[20px] w-[20px] place-items-center rounded-full bg-beige-2 text-text-3"><Minus size={12} strokeWidth={3} /></span>;
  return <span className={cn("text-[13px]", strong ? "font-medium text-ink" : "text-text-2")}>{v}</span>;
}

/** Refresh vs deep, line by line — so nobody buys the wrong one and
    nobody pays deep-clean money for a job that needed dusting. */
export function CleanCompare() {
  return (
    <Reveal>
      <div className="card overflow-hidden bg-white shadow-card">
        <div className="grid grid-cols-[1.6fr_1fr_1fr] items-end gap-2 border-b border-line bg-beige px-4 py-4 sm:px-6">
          <div>
            <div className="text-[15px] font-medium">What actually differs</div>
            <div className="t-small mt-0.5 hidden text-[12.5px] sm:block">Same inspector, same report, same photographs on both.</div>
          </div>
          {[refresh, deep].map((t, i) => (
            <div key={t.id} className={cn("rounded-[12px] px-2 py-2 text-center", i === 1 ? "bg-accent text-white" : "bg-white shadow-card")}>
              <div className="text-[13.5px] font-medium">{t.name}</div>
              <div className={cn("text-[12px] tabular-nums", i === 1 ? "text-white/75" : "text-text-2")}>from {inr(t.price["1"])}</div>
            </div>
          ))}
        </div>
        <div className="divide-y divide-line">
          {compare.map((c) => (
            <div key={c.l} className="grid grid-cols-[1.6fr_1fr_1fr] items-center gap-2 px-4 py-2.5 sm:px-6">
              <div className="text-[13.5px] leading-snug">{c.l}</div>
              <div className="text-center"><Cell v={c.r} /></div>
              <div className="text-center"><Cell v={c.d} strong /></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-2 border-t border-line bg-paper px-4 py-4 sm:px-6">
          <div className="text-[13px] text-text-2">Price, all in, by size</div>
          {[refresh, deep].map((t) => (
            <div key={t.id} className="text-center text-[12.5px] leading-relaxed tabular-nums text-text-2">
              {(["1", "2", "3", "4", "5"] as const).map((k) => (
                <div key={k}>{bhkLabel[k]} <span className="font-medium text-ink">{inr(t.price[k])}</span></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/** The grid, then the honest half — what we will not do. */
export function CleanIncluded() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr] lg:items-start">
      <Reveal>
        <div className="card bg-white p-6 shadow-card sm:p-7">
          <div className="text-[18px] font-medium tracking-[-0.02em]">What is included</div>
          <p className="t-small mt-1">Every line below is in the deep clean at the price you picked. Nothing here carries an asterisk.</p>
          {/* a plain list on a phone — twelve boxes stacked is a screen and a half */}
          <PhoneMore as="div" show={6} label="included" className="mt-5 grid divide-y divide-line sm:grid-cols-2 sm:gap-2.5 sm:divide-y-0">
            {included.map((i) => (
              <div key={i.t} className="py-3 sm:rounded-[12px] sm:bg-paper sm:p-3.5">
                <div className="flex items-start gap-2">
                  <span className="mt-[3px] grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full bg-accent-soft text-accent-2"><Check size={10} strokeWidth={3} /></span>
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium leading-snug">{i.t}</div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-text-2">{i.b}</div>
                  </div>
                </div>
              </div>
            ))}
          </PhoneMore>
        </div>
      </Reveal>

      <div className="grid gap-4">
        <Reveal delay={0.06}>
          <div className="card bg-white p-6 shadow-card sm:p-7">
            <div className="text-[18px] font-medium tracking-[-0.02em]">What is excluded</div>
            <p className="t-small mt-1">Said here rather than at your door.</p>
            <ul className="mt-4 space-y-2.5">
              {excluded.map((e) => (
                <li key={e} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                  <span className="mt-[2px] grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full bg-fail-soft text-[#b03434]"><X size={10} strokeWidth={3} /></span>{e}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card bg-beige p-6 sm:p-7">
            <div className="flex items-center gap-2 text-[15.5px] font-medium"><Info size={16} className="text-text-2" /> Please note</div>
            <ul className="mt-3 space-y-2.5">
              {notes.map((n) => <li key={n} className="text-[13.5px] leading-relaxed text-text-2">{n}</li>)}
            </ul>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/** The whole positioning of this page in one panel: every cleaning
    app asks you for a bucket, a power point, a ladder and a body at
    the door at 10 a.m. An owner abroad has none of those. */
export function CleanKit() {
  return (
    <Reveal>
      <div className="card grid gap-8 bg-ink p-6 text-white sm:p-8 lg:grid-cols-[1fr_1fr] lg:gap-12 md:p-10">
        <div>
          <p className="flex items-center gap-2 text-[15px] font-medium text-white/70"><KeyRound size={16} /> The list you would normally have to arrange</p>
          <h3 className="t-2 mt-2 max-w-[20ch] text-white">Every cleaning app needs a bucket, a ladder and you standing at the door.</h3>
          <p className="mt-4 max-w-[48ch] text-[15.5px] leading-relaxed text-white/75">
            Read the fine print on any of them: bring a bucket and water, provide a power point, arrange a ladder or a stool — and somebody has to
            be home to let the crew in and check the work afterwards. From another country, that person does not exist, so the booking never
            gets made.
          </p>
          <div className="mt-6">
            <div className="text-[13px] font-medium uppercase tracking-[0.08em] text-white/50">What the cleaning crew brings</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {bringVsNeed.weBring.map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px]"><Package size={11} className="text-white/60" /> {k}</span>
              ))}
            </div>
            <p className="mt-4 max-w-[52ch] text-[13px] leading-relaxed text-white/60">{bringVsNeed.onSite}</p>
          </div>
        </div>

        <div className="rounded-[18px] bg-white/[0.07] p-5 sm:p-6">
          <div className="text-[13px] font-medium uppercase tracking-[0.08em] text-white/50">What you do</div>
          <ol className="mt-4 space-y-5">
            {bringVsNeed.youDo.map((y, i) => (
              <li key={y.t} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent font-mono text-[13px] text-white">{i + 1}</span>
                <div>
                  <div className="text-[15.5px] font-medium">{y.t}</div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-white/70">{y.b}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-[13.5px] leading-relaxed text-white/75">That is the entire list. No keys couriered, no spare set with a neighbour, nobody taking a day off to supervise strangers in your house.</p>
            <Link href={START} className="btn btn-white btn-sm mt-4 w-full sm:w-auto">{START_LABEL} <ArrowRight size={15} /></Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/** Thirteen surfaces, each drawn in the same frame dirty and clean.
    Drag any of them. When the first real jobs are photographed these
    become job photos in the same component. */
export function CleanWall() {
  return (
    <div>
      <Reveal>
        {/* each one is a slider, so they cannot swipe sideways — a few,
            then the rest behind a tap */}
        <PhoneMore as="div" show={3} label="surfaces" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shotWall.map((s, i) => (
            <BeforeAfter key={s.name} name={s.name} label={s.label} time={s.time} className={i === 0 ? "shadow-card" : "shadow-card"} />
          ))}
        </PhoneMore>
      </Reveal>
      <Reveal delay={0.06}>
        <p className="t-small mt-4 max-w-[80ch] text-[13px]">
          These are examples we made of what each surface looks like before and after — drawings and staged photos, not a customer&apos;s home —
          so you can see the standard we work to before you book. From your visit onwards they are replaced by the real thing: your rooms, your
          surfaces, photographed from the same spot at the start and the end of the job, GPS and time stamped, in the report you get within the hour.
        </p>
      </Reveal>
    </div>
  );
}

/** Who does what. The crew is bought in; the supervision, the proof and
    the accountability are ours — and that split is the honest version of
    the product, so it is stated plainly rather than blurred. */
export function CleanCrew() {
  const roles = crew(fulfilment.partner);
  return (
    <Reveal>
      <div className="card bg-white p-6 shadow-card sm:p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
          <div>
            <p className="flex items-center gap-2 text-[15px] font-medium text-text-2"><Users size={16} className="text-accent" /> Who actually does what</p>
            <h3 className="t-2 mt-2 max-w-[20ch]">We don&rsquo;t pretend to own a cleaning company. We own the part that&rsquo;s missing.</h3>
            <p className="t-body mt-4 max-w-[48ch] text-text-2">
              Good cleaning crews already exist in this city. What doesn&rsquo;t exist, for an owner who isn&rsquo;t in the country, is somebody to let
              them in, stay while they work, tell you the truth about the result and carry the blame if it&rsquo;s wrong. That is the whole job we do.
            </p>
            <Link href={START} className="btn btn-accent mt-6">{START_LABEL} <ArrowRight size={16} /></Link>
          </div>
          <ol className="swipe grid gap-3 [--swipe-bleed:1.5rem] sm:grid-cols-2">
            {roles.map((r, i) => (
              <li key={r.t} className="rounded-[14px] bg-paper p-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft font-mono text-[13px] text-accent-2">{i + 1}</span>
                <div className="mt-3 text-[15px] font-medium">{r.t}</div>
                <p className="t-small mt-1.5 text-[13.5px] leading-relaxed">{r.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Reveal>
  );
}

/* ── the reason anybody buys a deep clean ──────────────────────
   Not "my flat is a bit dusty". It is: the door has been shut for a
   year or two, I land on Friday, and I am not spending the first day
   of a short trip on my knees in a bathroom. */
export function ComingBack() {
  const cols = [
    {
      I: CalendarClock,
      t: "What two years does to a shut house",
      list: [
        "A film of dust on every surface, and cobwebs in every ceiling corner",
        "Kitchen grease gone hard — the chimney filter and hob no longer wipe clean",
        "Bathroom grout yellowed, taps and shower heads scaled up, traps dried out",
        "Damp, a leak or a pest problem nobody was there to catch early",
        "And the smell you notice in the first three seconds at the door",
      ],
    },
    {
      I: DoorOpen,
      t: "What happens on the day",
      list: [
        "Your inspector lets the crew in — nobody from your family needs to be there",
        "The full 42-item inspection runs while the crew works, not instead of it",
        "The crew deep cleans room by room with the inspector on site the entire time",
        "Every room photographed from the same spot before they start and after they finish",
        "An exit walkthrough on video, GPS and time stamped, before the door is locked",
      ],
    },
    {
      I: ClipboardList,
      t: "What lands in your inbox, within the hour",
      list: [
        "Before and after of every room, so you judge the clean yourself",
        "The condition report — leaks, damp, electricals, locks, water, gas",
        "Anything broken, photographed and quoted, with nothing touched until you say yes",
        "A report you can compare against the next visit",
        "Approve a repair from wherever you are and it is done before you land",
      ],
    },
  ];
  return (
    <div className="grid gap-4">
      <Reveal>
        <div className="card bg-ink p-6 text-white sm:p-8 md:p-10">
          <p className="flex items-center gap-2 text-[15px] font-medium text-white/70"><Sparkles size={16} /> Why people book the deep clean</p>
          <h3 className="t-2 mt-2 max-w-[24ch] text-white">You haven&rsquo;t opened that door in two years. You land on Friday.</h3>
          <p className="mt-4 max-w-[70ch] text-[15.5px] leading-relaxed text-white/75">
            A house nobody walks through doesn&rsquo;t wait politely. It gets dusty, then greasy, then it starts hiding a leak. And the one thing
            you can&rsquo;t do from another country is send someone in to fix it — every cleaning company in the city needs a person at home at
            10 a.m. to let them in and check the work. So the booking never gets made, and the first day of a short trip goes to a bucket and
            a mop. That is the entire gap this closes: we are the person at the door, and you get the house <em className="not-italic text-white">and</em> the truth about it in the same visit.
          </p>
        </div>
      </Reveal>
      <div className="swipe grid gap-3 lg:grid-cols-3">
        {cols.map((c, i) => (
          <Reveal key={c.t} delay={i * 0.06}>
            <div className="card h-full bg-white p-6 shadow-card">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><c.I size={18} /></span>
              <div className="mt-3 text-[15.5px] font-medium">{c.t}</div>
              <ul className="mt-3 space-y-2.5">
                {c.list.map((l) => (
                  <li key={l} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-text-2">
                    <span className="mt-[5px] h-[5px] w-[5px] shrink-0 rounded-full bg-accent" />{l}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/** Every price on one screen, read-only. Choosing happens in the quote. */
export function CleanPrices() {
  return (
    <div className="grid gap-4">
      <Reveal>
        <div className="card overflow-hidden bg-white shadow-card">
          <div className="grid grid-cols-[1.3fr_1fr_1fr] items-end gap-2 border-b border-line bg-beige px-4 py-4 sm:px-6">
            <div>
              <div className="text-[15px] font-medium">All in, by size</div>
              <div className="t-small mt-0.5 hidden text-[12.5px] sm:block">Inspector, crew, report and before/after photos — one number.</div>
            </div>
            {tiers.map((t, i) => (
              <div key={t.id} className={cn("rounded-[12px] px-2 py-2 text-center", i === 1 ? "bg-accent text-white" : "bg-white shadow-card")}>
                <div className="text-[13.5px] font-medium">{t.name}</div>
                <div className={cn("text-[11.5px]", i === 1 ? "text-white/75" : "text-text-2")}>{t.tagline}</div>
              </div>
            ))}
          </div>
          {bhkKeys.map((k) => (
            <div key={k} className="grid grid-cols-[1.3fr_1fr_1fr] items-center gap-2 border-t border-line px-4 py-3 sm:px-6">
              <div>
                <div className="text-[14.5px] font-medium">{bhkLabel[k]}</div>
                <div className="text-[12px] text-text-2">{coverageLine(k)}</div>
              </div>
              {tiers.map((t, i) => (
                <div key={t.id} className={cn("text-center text-[17px] font-medium tabular-nums", i === 1 && "text-accent-2")}>{inr(t.price[k])}</div>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2 border-t border-line bg-paper px-4 py-3.5 sm:px-6">
            <div className="text-[13px] text-text-2">Added to an inspection you&rsquo;re already booking</div>
            {tiers.map((t) => (
              <div key={t.id} className="text-center text-[13px] tabular-nums text-text-2">from +{inr(Math.min(...bhkKeys.map((k) => t.rider[k])))}</div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="card bg-beige p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[18px] font-medium tracking-[-0.02em]">Everything that can be added, and what it costs</div>
              <div className="t-small mt-0.5">Chosen in your quote, before you pay. Nothing is added at the door.</div>
            </div>
            <Link href={START} className="btn btn-accent btn-sm shrink-0">{START_LABEL} <ArrowRight size={15} /></Link>
          </div>
          <div className="swipe mt-5 grid gap-3 lg:grid-cols-3">
            {extraGroups.map((g) => (
              <div key={g.id} className="card bg-white p-5 shadow-card">
                <div className="text-[15px] font-medium">{g.name}</div>
                <ul className="mt-3 divide-y divide-line">
                  {g.items.map((e) => (
                    <li key={e.id} className="flex items-baseline justify-between gap-3 py-2 text-[13.5px]">
                      <span className="min-w-0">{e.name}{e.per && <span className="text-text-3"> · {e.per}</span>}</span>
                      <span className={cn("shrink-0 font-medium tabular-nums", e.price === 0 ? "text-[#157a44]" : "")}>{e.price === 0 ? "included" : inr(e.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
