import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowUpRight, BadgeCheck, CalendarDays, CheckCircle2, ClipboardList,
  FileText, Flag, LandPlot, MapPin, Plus, ShieldCheck,
} from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { propertyView, timeline, inspectorsById } from "@/lib/queries";
import { HealthRing } from "@/components/ui/HealthRing";
import { EvidenceFrame } from "@/components/ui/EvidenceFrame";
import { Reveal } from "@/components/ui/Reveal";
import { Panel, PanelHead, Stat, StatusPill, money } from "@/components/app/ui";
import { AccessNotes } from "@/components/app/AccessNotes";
import { PinPanel } from "@/components/app/PinPanel";
import { mapConfig } from "@/lib/ola";
import { blocksFor, itemCount } from "@/lib/checklist";
import { bhkLabel } from "@/lib/cleaning";
import { fmtDate, fmtDayDate, relative } from "@/lib/format";
import { plans, plotPlans, carePlusCover } from "@/lib/pricing";
import { cn } from "@/lib/cn";

export default async function Page({ params }: PageProps<"/app/properties/[id]">) {
  const user = await requireOwner();
  const { id } = await params;
  const v = await propertyView(user.id, id);
  if (!v) notFound();

  const [events, inspectors] = await Promise.all([timeline(user.id, id), inspectorsById()]);
  const { property: p, score, lastReport, nextVisit, liveVisit, openIssues, visits, reports, subscription } = v;
  const plan = [...plans, ...plotPlans].find((x) => x.id === subscription?.planId);
  const blocks = blocksFor(p);
  const done = visits.filter((x) => ["ready", "closed"].includes(x.status));

  return (
    <>
      <Link href="/app/properties" className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2 transition hover:text-ink"><ArrowLeft size={14} /> Properties</Link>

      {/* ── the place itself ───────────────────────────────── */}
      <Reveal>
        <Panel className="overflow-hidden">
          <div className="relative">
            <EvidenceFrame variant={p.cover} src={null} id="" room={p.locality || p.city} time={lastReport ? `last checked ${fmtDate(lastReport.publishedAt)}` : "not yet visited"} tone={score === null ? undefined : score >= 70 ? "pass" : score >= 40 ? "attn" : "fail"} ratio="16 / 6" />
          </div>
          <div className="flex flex-wrap items-start gap-5 p-6">
            <div className="grow basis-[15rem]">
              <h1 className="serif text-[clamp(1.8rem,3.2vw,2.4rem)] leading-[1.06] tracking-[-0.035em]">{p.label}</h1>
              <div className="t-small mt-2 flex items-center gap-1.5">
                {p.kind === "plot" ? <LandPlot size={13} /> : <MapPin size={13} />} {p.address}{p.city ? `, ${p.city}` : ""}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="chip">{p.kind === "plot" ? "Plot & land" : `${p.type} · ${bhkLabel[p.size]}`}</span>
                {plan && <span className="chip chip-accent">{plan.name}</span>}
                {openIssues.length > 0 && <span className={cn("chip", openIssues.some((i) => i.severity === "fail") ? "chip-fail" : "chip-warn")}>{openIssues.length} waiting on you</span>}
                <span className="chip">Added {fmtDate(p.createdAt, { year: true })}</span>
              </div>
            </div>
            {score !== null && <HealthRing score={score} size={92} stroke={7.5} label="Health" delay={0.2} />}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-line p-4 sm:grid-cols-4">
            <Stat n={done.length} l="Visits done" />
            <Stat n={itemCount(p)} l="Items per visit" />
            <Stat n={openIssues.length} l="Open issues" tone={openIssues.length ? "fail" : undefined} />
            <Stat n={subscription ? `${subscription.visitsTotal - subscription.visitsUsed}` : "—"} l="Visits left on plan" tone={subscription ? "accent" : undefined} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line p-4">
            <Link href={`/app/book?property=${p.id}` as Route} className="btn btn-accent btn-sm"><Plus size={15} /> Book a visit</Link>
            {lastReport && <Link href={`/app/reports/${lastReport.id}` as Route} className="btn btn-white btn-sm"><FileText size={15} /> Latest report</Link>}
            {liveVisit && <Link href={`/app/visits/${liveVisit.id}` as Route} className="btn btn-ink btn-sm">Follow the visit now</Link>}
          </div>
        </Panel>
      </Reveal>

      {/* ── next visit, front and centre ───────────────────── */}
      {(nextVisit || liveVisit) && (
        <Reveal delay={0.05} className="mt-4">
          <Link href={`/app/visits/${(liveVisit ?? nextVisit)!.id}` as Route} className="group card flex flex-wrap items-center gap-4 border border-accent/20 bg-accent-tint p-5 transition hover:shadow-card">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-accent shadow-card"><CalendarDays size={18} /></span>
            <div className="grow basis-[15rem]">
              <div className="text-[15.5px] font-semibold text-accent-2">
                {liveVisit ? "Happening right now" : `${fmtDayDate(nextVisit!.scheduledFor)} · ${nextVisit!.slot}`}
              </div>
              <div className="t-small mt-0.5 text-accent-2/70">
                {(() => { const ins = inspectors[(liveVisit ?? nextVisit)!.inspectorId]; return ins ? `${ins.name} · ${ins.bg} · ${ins.visits} visits` : "We are assigning an inspector — you will get their name and photo before the day."; })()}
              </div>
            </div>
            <ArrowUpRight size={17} className="shrink-0 text-accent transition group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* ── history ─────────────────────────────────────── */}
        <div className="grid gap-4">
          <Reveal>
            <Panel>
              <PanelHead title="Visits & reports" meta={`${visits.length} in total`} action={<Link href="/app/visits" className="btn btn-pill btn-sm">All visits</Link>} />
              {visits.length === 0 ? (
                <p className="t-small px-5 py-8 text-center">Nothing yet. The first visit is what sets the baseline everything else is compared to.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {visits.map((x) => {
                    const rep = reports.find((r) => r.id === x.reportId);
                    const ins = inspectors[x.inspectorId];
                    return (
                      <li key={x.id}>
                        <Link href={(rep ? `/app/reports/${rep.id}` : `/app/visits/${x.id}`) as Route} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                          <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[12px]", rep ? "bg-accent-tint text-accent" : "bg-beige text-text-2")}>
                            {rep ? <FileText size={17} /> : <CalendarDays size={17} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[14.5px] font-medium">{fmtDate(x.scheduledFor, { year: true })} · {x.kind === "cleaning" ? "Cleaning" : x.kind === "plot" ? "Plot visit" : "Inspection"}</div>
                            <div className="t-small mt-0.5 truncate">{ins ? `${ins.name} · ` : ""}{x.ref}{rep ? ` · ${rep.counts.fail} fail, ${rep.counts.attn} attention` : ""}</div>
                          </div>
                          {rep ? <HealthRing score={rep.score} size={40} stroke={4} delay={0.1} /> : <StatusPill status={x.status} />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </Reveal>

          <Reveal delay={0.05}>
            <Panel>
              <PanelHead title="What we check here" meta={`${blocks.length} areas · ${itemCount(p)} items, every visit`} />
              <ul className="grid gap-px bg-line sm:grid-cols-2">
                {blocks.map((b) => (
                  <li key={b.name} className="bg-white px-5 py-3.5">
                    <div className="flex items-center gap-2 text-[14px] font-medium"><ClipboardList size={13} className="text-accent" /> {b.name}</div>
                    <div className="t-small mt-1 leading-snug">{b.items.join(" · ")}</div>
                  </li>
                ))}
              </ul>
            </Panel>
          </Reveal>
        </div>

        {/* ── the practical column ────────────────────────── */}
        <div className="grid gap-4 self-start">
          <Reveal>
            <Panel id="location" className={cn(p.pin?.source === "inspector" && !p.pin.confirmedAt && "border-warn/40")}>
              <PanelHead title="Where it is" meta="The pin every visit is measured from" />
              <PinPanel id={p.id} plot={p.kind === "plot"} pin={p.pin} map={mapConfig()} />
            </Panel>
          </Reveal>

          <Reveal>
            <Panel>
              <PanelHead title="Access & keys" meta="What the inspector reads before they leave" />
              <AccessNotes p={p} />
            </Panel>
          </Reveal>

          {subscription && plan && (
            <Reveal delay={0.05}>
              <Panel>
                <PanelHead title={plan.name} meta={`Renews ${subscription.renewsAt ? fmtDate(subscription.renewsAt, { year: true }) : "—"}`} action={<Link href="/app/plan" className="btn btn-pill btn-sm">Manage</Link>} />
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between text-[13.5px]">
                    <span className="text-text-2">Visits used</span>
                    <span className="font-medium tabular-nums">{subscription.visitsUsed} of {subscription.visitsTotal}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-beige-2">
                    <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${(subscription.visitsUsed / subscription.visitsTotal) * 100}%` }} />
                  </div>
                  {subscription.planId === "care-plus" && (
                    <div className="mt-4 rounded-[12px] bg-paper p-3.5">
                      <div className="flex items-center gap-2 text-[13.5px] font-medium"><ShieldCheck size={14} className="text-accent" /> Repair cover</div>
                      <div className="t-small mt-1">{money(subscription.coverUsedInr)} of {money(carePlusCover.yearly)} used this year</div>
                    </div>
                  )}
                </div>
              </Panel>
            </Reveal>
          )}

          <Reveal delay={0.1}>
            <Panel>
              <PanelHead title="This property's history" meta={`${events.length} entries`} />
              {events.length === 0 ? (
                <p className="t-small px-5 py-8 text-center">Nothing recorded yet.</p>
              ) : (
                <ol className="relative px-5 py-4">
                  <span className="absolute bottom-6 left-[29px] top-7 w-px bg-line" />
                  {events.slice(0, 8).map((e) => (
                    <li key={e.id} className="relative flex gap-3.5 pb-5 last:pb-0">
                      <span className={cn("relative z-10 mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ring-4 ring-white",
                        e.type.startsWith("issue") ? "bg-warn-soft text-warn" : e.type.startsWith("report") ? "bg-pass-soft text-pass" : "bg-accent-tint text-accent")}>
                        {e.type.startsWith("report") ? <CheckCircle2 size={11} /> : e.type.startsWith("issue") ? <Flag size={10} /> : <BadgeCheck size={11} />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium leading-snug">{e.title}</div>
                        <div className="t-small mt-0.5 leading-snug">{e.body}</div>
                        <div className="mt-1 text-[11.5px] text-text-3">{relative(e.at)}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </Reveal>
        </div>
      </div>
    </>
  );
}
