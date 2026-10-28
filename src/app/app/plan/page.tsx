import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Check, Minus, ShieldCheck, Sparkles } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { freeSpotsLeft, propertyViews } from "@/lib/queries";
import { Empty, PageHead, Panel, PanelHead, money } from "@/components/app/ui";
import { FoundingCard } from "@/components/app/FoundingCard";
import { Reveal } from "@/components/ui/Reveal";
import { plans, carePlusCover } from "@/lib/pricing";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata = { title: "Plan & cover" };

export default async function Page() {
  const user = await requireOwner();
  const [views, freeLeft] = await Promise.all([propertyViews(user.id), freeSpotsLeft()]);
  const withPlan = views.filter((v) => v.subscription);
  const without = views.filter((v) => !v.subscription);
  const hasCarePlus = withPlan.some((v) => v.subscription!.planId === "care-plus");

  return (
    <>
      <PageHead
        eyebrow="What you are on"
        title="Plan & cover"
        lede="What each property buys you, how much of it is left, and exactly what the repair cover does and does not absorb."
      />

      <div className="grid gap-4">
        <Reveal><FoundingCard user={user} properties={views.map((v) => v.property)} left={freeLeft} firstTime={!views.some((v) => v.visits.length)} /></Reveal>

        {withPlan.length === 0 && (
          <Panel><Empty icon={Sparkles} title="No plan running." body="Every visit so far has been a one-off. A yearly plan books the rhythm for you — and stops you having to remember."
            cta={<Link href="/app/book" className="btn btn-accent">See the plans <ArrowRight size={15} /></Link>} /></Panel>
        )}

        {withPlan.map((v, i) => {
          const s = v.subscription!;
          const plan = plans.find((p) => p.id === s.planId);
          const left = s.visitsTotal - s.visitsUsed;
          return (
            <Reveal key={s.id} delay={0.04 * i}>
              <Panel>
                <PanelHead
                  title={<span className="flex items-center gap-2">{plan?.name ?? s.planId} <span className="chip chip-accent">Active</span></span>}
                  meta={`${v.property.label} · renews ${s.renewsAt ? fmtDate(s.renewsAt, { year: true }) : "—"} · ${money(s.amountInr)} a year`}
                  action={<Link href={`/app/properties/${v.property.id}` as Route} className="btn btn-pill btn-sm">Property</Link>}
                />
                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[14px] font-medium">Inspections</span>
                      <span className="t-small tabular-nums">{s.visitsUsed} used · {left} left</span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {Array.from({ length: s.visitsTotal }, (_, n) => (
                        <span key={n} className={cn("h-2 flex-1 rounded-full", n < s.visitsUsed ? "bg-accent" : "bg-beige-2")} />
                      ))}
                    </div>
                    <ul className="mt-4 grid gap-1.5">
                      {plan?.includes.slice(0, 4).map((x) => (
                        <li key={x} className="flex gap-2 text-[13.5px] leading-snug text-text-2"><Check size={13} className="mt-0.5 shrink-0 text-accent" /> {x}</li>
                      ))}
                    </ul>
                  </div>

                  {s.planId === "care-plus" ? (
                    <div className="rounded-[14px] bg-paper p-4">
                      <div className="flex items-center gap-2 text-[14px] font-medium"><ShieldCheck size={15} className="text-accent" /> Repair cover this year</div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-[28px] font-medium tabular-nums tracking-[-0.03em]">{money(carePlusCover.yearly - s.coverUsedInr)}</span>
                        <span className="t-small">left of {money(carePlusCover.yearly)}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-beige-2">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (s.coverUsedInr / carePlusCover.yearly) * 100)}%` }} />
                      </div>
                      <p className="t-small mt-2.5 leading-snug">Up to {money(carePlusCover.perIncident)} per repair. Labour always covered; parts up to {money(carePlusCover.partsPerIncident)} per repair.</p>
                    </div>
                  ) : (
                    <div className="rounded-[14px] border border-dashed border-line-2 p-4">
                      <div className="text-[14px] font-medium">Repairs are not covered on {plan?.name}</div>
                      <p className="t-small mt-1 leading-snug">You approve each quote and pay for it. Care+ absorbs up to {money(carePlusCover.yearly)} of repairs a year instead.</p>
                      <Link href="/app/book" className="btn btn-pill btn-sm mt-3">Look at Care+</Link>
                    </div>
                  )}
                </div>
              </Panel>
            </Reveal>
          );
        })}

        {without.length > 0 && (
          <Reveal>
            <Panel>
              <PanelHead title="Properties without a plan" meta="Booked one visit at a time" />
              <ul className="divide-y divide-line">
                {without.map((v) => (
                  <li key={v.property.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-medium">{v.property.label}</div>
                      <div className="t-small truncate">{v.property.address}</div>
                    </div>
                    <Link href={`/app/book?property=${v.property.id}` as Route} className="btn btn-pill btn-sm shrink-0">Put it on a plan</Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </Reveal>
        )}

        {/* the cover, in plain words — same terms the public page prints */}
        <Reveal>
          <Panel>
            <PanelHead title="What the repair cover means" meta={hasCarePlus ? "Your Care+ terms" : "If you move to Care+"} />
            <div className="grid gap-px bg-line md:grid-cols-2">
              <ul className="grid gap-4 bg-white p-5">
                {carePlusCover.terms.map((t) => (
                  <li key={t.t} className="flex gap-2.5">
                    <Check size={15} className="mt-0.5 shrink-0 text-pass" />
                    <div><div className="text-[14px] font-medium">{t.t}</div><p className="t-small mt-0.5 leading-snug">{t.b}</p></div>
                  </li>
                ))}
              </ul>
              <div className="bg-white p-5">
                <div className="t-label">Not covered — said plainly</div>
                <ul className="mt-3 grid gap-2">
                  {carePlusCover.excluded.map((x) => (
                    <li key={x} className="flex gap-2.5 text-[13.5px] leading-snug text-text-2"><Minus size={14} className="mt-0.5 shrink-0 text-text-3" /> {x}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-line p-5">
              <div className="t-label">How it plays out in practice</div>
              <ul className="mt-3 grid gap-2">
                {carePlusCover.examples.map((e) => (
                  <li key={e.s} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] bg-paper px-4 py-3">
                    <span className="min-w-0 flex-1 text-[13.5px]">{e.s}</span>
                    <span className="shrink-0 font-mono text-[13px] tabular-nums text-text-2">{e.cost}</span>
                    <span className={cn("chip max-w-full", e.ok ? "chip-pass" : "chip-warn")}>{e.r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </Reveal>
      </div>
    </>
  );
}
