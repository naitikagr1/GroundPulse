import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, CalendarClock, CalendarDays, CreditCard, Flag,
  Home as HomeIcon, Hourglass, MapPin, Plus, Radio, Wrench,
} from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { freeSpotsLeft, issueHref, propertyViews, portfolioScore, openIssues, timeline, invoices, inspectorsById, repairsToSchedule, visits as allVisits, isOverdue, UPCOMING } from "@/lib/queries";
import { PropertyCard } from "@/components/app/PropertyCard";
import { FoundingCard } from "@/components/app/FoundingCard";
import { EntryCode } from "@/components/app/EntryCode";
import { Greeting } from "@/components/app/Greeting";
import { Empty, Panel, PanelHead, Stat, StatusPill, money } from "@/components/app/ui";
import { HealthRing } from "@/components/ui/HealthRing";
import { Reveal } from "@/components/ui/Reveal";
import { daysBetween, fmtDayDate, relative, slotInZone, todayKey } from "@/lib/format";
import { cn } from "@/lib/cn";

export default async function Dashboard() {
  const user = await requireOwner();
  const [views, issues, events, invs, inspectors, toSchedule, mine, freeLeft] = await Promise.all([
    propertyViews(user.id), openIssues(user.id), timeline(user.id), invoices(user.id), inspectorsById(), repairsToSchedule(user.id), allVisits(user.id), freeSpotsLeft(),
  ]);

  const score = portfolioScore(views);
  const liveView = views.find((v) => v.liveVisit);
  const live = liveView?.liveVisit ?? null;
  const liveProperty = liveView?.property;
  const due = invs.filter((i) => i.status === "due");
  const label = (id: string) => views.find((v) => v.property.id === id)?.property;
  /* Every booked visit, not one per property — two on the same flat are two visits. */
  const upcoming = mine.filter((v) => (UPCOMING as readonly string[]).includes(v.status) && label(v.propertyId)).sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1));
  const overdue = upcoming.filter(isOverdue);
  const soon = upcoming.find((v) => !isOverdue(v) && daysBetween(todayKey(), v.scheduledFor) <= 3);
  const decide = issues.filter((i) => i.quote);
  const quoting = issues.filter((i) => !i.quote);
  const first = user.name.split(" ")[0];

  /* A new account lands here straight from the welcome: the free visit
     leads, and adding the home is the way to it. */
  if (!views.length) {
    return (
      <div className="grid gap-5">
        <Reveal><FoundingCard user={user} properties={[]} left={freeLeft} firstTime /></Reveal>
        <Panel>
          <Empty
            icon={HomeIcon}
            title="Nothing here yet."
            body="Add the first property and we will show you its condition, its visits and every decision waiting on you — all on this page."
            cta={<Link href="/app/properties/new?then=book" className="btn btn-accent"><Plus size={16} /> Add a property</Link>}
          />
        </Panel>
      </div>
    );
  }

  const heldLive = live?.status === "submitted";

  return (
    <div className="grid gap-5">
      {/* ── who you are, and how it all stands ─────────────── */}
      <Reveal>
        <section className="card overflow-hidden border border-line bg-white shadow-card">
          <div className="flex flex-wrap items-center gap-6 p-6 sm:p-7">
            <div className="grow basis-[15rem]">
              <p className="t-label"><Greeting name={first} /></p>
              <h1 className="serif mt-1.5 text-[clamp(1.8rem,3.2vw,2.5rem)] leading-[1.06] tracking-[-0.035em]">
                {decide.length
                  ? <>{decide.length} {decide.length === 1 ? "thing needs" : "things need"} your decision.</>
                  : live && !heldLive ? <>Someone is at your {liveProperty?.kind === "plot" ? "plot" : "place"} right now.</>
                  : overdue.length ? <>A visit needs a new day.</>
                  : upcoming.length ? <>All clear. Next visit {relative(upcoming[0].scheduledFor)}.</>
                  : <>All clear across {views.length} {views.length === 1 ? "property" : "properties"}.</>}
              </h1>
              <p className="t-small mt-2 max-w-[54ch]">
                {decide.length
                  ? "Nothing gets repaired until you say so. Open the report, look at the photographs, then decide."
                  : quoting.length
                    ? `${quoting.length} flagged ${quoting.length === 1 ? "item is" : "items are"} with a verified pro for a price. You decide once the quote is in.`
                    : "Everything we have checked is where it should be. You will hear from us the moment that changes."}
              </p>
            </div>
            {score !== null && <HealthRing score={score} size={104} stroke={8} label="Portfolio" delay={0.25} />}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-line p-4 sm:grid-cols-4 sm:p-5">
            <Stat n={views.length} l={views.length === 1 ? "Property" : "Properties"} />
            <Stat n={upcoming.length} l="Visits booked" tone={upcoming.length ? "accent" : undefined} />
            <Stat n={decide.length + toSchedule.length} l="Waiting on you" tone={decide.length + toSchedule.length ? "fail" : undefined} />
            <Stat n={due.length ? money(due.reduce((n, i) => n + i.amountInr, 0)) : "—"} l="Payable" tone={due.length ? "warn" : undefined} />
          </div>
        </section>
      </Reveal>

      {/* ── the launch offer, while it is still theirs ──────── */}
      <Reveal delay={0.04}><FoundingCard user={user} properties={views.map((v) => v.property)} left={freeLeft} firstTime={!mine.length} compact /></Reveal>

      {/* ── happening right now ─────────────────────────────── */}
      {live && liveProperty && (
        <Reveal delay={0.05}>
          <section className="on-dark card overflow-hidden bg-ink shadow-float">
            <div className="flex flex-wrap items-center gap-4 p-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-white">{heldLive ? <Hourglass size={20} /> : <Radio size={20} />}</span>
              <div className="grow basis-[15rem]">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">
                  {!heldLive && <span className="ping relative h-[6px] w-[6px] rounded-full bg-pass text-pass" />} {heldLive ? "Being checked" : "Live"}
                </div>
                <h2 className="mt-1 text-[20px] font-medium tracking-[-0.025em] text-white">
                  {heldLive
                    ? "The report is with our reviewer"
                    : `${inspectors[live.inspectorId]?.name ?? "Your inspector"} is ${live.status === "on_site" ? "on site" : "on the way"}`}
                </h2>
                <p className="mt-1 text-[13.5px] text-white/60">
                  {liveProperty.label} · {heldLive ? "a person reads it before it reaches you — usually within a few hours" : `${live.startedAt ? `went in ${relative(live.startedAt)}` : fmtDayDate(live.scheduledFor)} · ${live.slot} IST`}
                </p>
              </div>
              <Link href={`/app/visits/${live.id}` as Route} className="btn btn-line text-white">Follow along <ArrowRight size={15} /></Link>
            </div>
            {live.status === "en_route" && (
              <div className="px-6 pb-6"><EntryCode dark code={live.otp} property={liveProperty.label} when="today" keyHolder={liveProperty.keyHolderName || undefined} inspector={inspectors[live.inspectorId]?.name} /></div>
            )}
          </section>
        </Reveal>
      )}

      {/* ── the next visit, with its code, when it is close ─── */}
      {soon && !(live && live.id === soon.id) && label(soon.propertyId) && (
        <Reveal delay={0.06}>
          <Panel>
            <PanelHead
              title={`${label(soon.propertyId)!.label} · ${relative(soon.scheduledFor)}`}
              meta={`${fmtDayDate(soon.scheduledFor)} · ${soon.slot} IST${slotInZone(soon.scheduledFor, soon.slot, user.tz) ? ` · ${slotInZone(soon.scheduledFor, soon.slot, user.tz)} your time` : ""}`}
              action={<Link href={`/app/visits/${soon.id}` as Route} className="btn btn-pill btn-sm">Visit</Link>}
            />
            <div className="p-4">
              <EntryCode code={soon.otp} property={label(soon.propertyId)!.label} when={fmtDayDate(soon.scheduledFor)} keyHolder={label(soon.propertyId)!.keyHolderName || undefined} inspector={inspectors[soon.inspectorId]?.name} />
            </div>
          </Panel>
        </Reveal>
      )}

      {/* ── waiting on you ──────────────────────────────────── */}
      {(decide.length > 0 || toSchedule.length > 0 || overdue.length > 0 || due.length > 0) && (
        <Reveal delay={0.08}>
          <Panel>
            <PanelHead title="Waiting on you" meta="Nothing moves until you decide" />
            <ul className="divide-y divide-line">
              {overdue.map((v) => (
                <li key={v.id}>
                  <Link href={`/app/visits/${v.id}` as Route} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warn-soft text-warn"><CalendarClock size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium">Pick a new day for {label(v.propertyId)?.label}</div>
                      <div className="t-small mt-0.5 truncate">{fmtDayDate(v.scheduledFor)} went by and nobody could make it — sorry. Moving it is free.</div>
                    </div>
                    <span className="btn btn-pill btn-sm shrink-0">Move</span>
                  </Link>
                </li>
              ))}
              {decide.map((i) => (
                <li key={i.id}>
                  <Link href={issueHref(i) as Route} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", i.severity === "fail" ? "bg-fail-soft text-fail" : "bg-warn-soft text-warn")}><Flag size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium">{i.title}</div>
                      <div className="t-small mt-0.5 truncate">{label(i.propertyId)?.label} · {i.room} · {i.ref}</div>
                    </div>
                    {i.quote && <span className="hidden shrink-0 text-right sm:block"><span className="block text-[15px] font-medium tabular-nums">{money(i.quote.total)}</span><span className="t-small">quoted</span></span>}
                    <span className="btn btn-pill btn-sm shrink-0 group-hover:bg-accent group-hover:text-white group-hover:shadow-none">Decide</span>
                  </Link>
                </li>
              ))}
              {toSchedule.map((i) => (
                <li key={i.id}>
                  <Link href={issueHref(i) as Route} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><Wrench size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium">Pick a day for: {i.title}</div>
                      <div className="t-small mt-0.5 truncate">{label(i.propertyId)?.label} · approved · {i.repair?.providerName}</div>
                    </div>
                    <span className="btn btn-pill btn-sm shrink-0">Choose</span>
                  </Link>
                </li>
              ))}
              {due.map((i) => (
                <li key={i.id}>
                  <Link href="/app/billing" className="group flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warn-soft text-warn"><CreditCard size={16} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-medium">{i.title}</div>
                      <div className="t-small mt-0.5">{i.ref} · raised {relative(i.createdAt)}</div>
                    </div>
                    <span className="shrink-0 text-[15px] font-medium tabular-nums">{money(i.amountInr)}</span>
                    <ArrowUpRight size={16} className="shrink-0 text-text-3 transition group-hover:text-accent" />
                  </Link>
                </li>
              ))}
            </ul>
            {quoting.length > 0 && (
              <p className="t-small flex items-center gap-2 border-t border-line px-5 py-3.5">
                <Hourglass size={13} className="shrink-0" /> {quoting.length} more {quoting.length === 1 ? "item is" : "items are"} waiting for a quote from a verified pro — it lands here when it is in.
              </p>
            )}
          </Panel>
        </Reveal>
      )}

      {/* ── properties ──────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <div className="flex items-end justify-between pb-1 pt-2">
          <h2 className="serif text-[24px] tracking-[-0.03em]">Your properties</h2>
          <Link href="/app/properties/new" className="btn btn-pill btn-sm"><Plus size={15} /> Add</Link>
        </div>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2">
        {views.map((v, i) => <Reveal key={v.property.id} delay={0.04 * i}><PropertyCard v={v} /></Reveal>)}
      </div>

      {/* ── what is booked, and what just happened ──────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Panel className="h-full">
            <PanelHead title="Coming up" meta={upcoming.length ? `${upcoming.length} booked` : "Nothing booked"} action={<Link href="/app/book" className="btn btn-pill btn-sm">Book</Link>} />
            {upcoming.length === 0 ? (
              <p className="t-small px-5 py-8 text-center">A quarterly rhythm is what keeps a shut house from going quietly wrong. Book the next one whenever you are ready.</p>
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.slice(0, 6).map((v) => {
                  const prop = label(v.propertyId)!;
                  const ins = inspectors[v.inspectorId];
                  const late = isOverdue(v);
                  return (
                    <li key={v.id}>
                      <Link href={`/app/visits/${v.id}` as Route} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-paper">
                        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[12px]", late ? "bg-warn-soft text-warn" : "bg-accent-tint text-accent")}>
                          {late ? <CalendarClock size={17} /> : <CalendarDays size={17} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14.5px] font-medium">{prop.label}</div>
                          <div className="t-small mt-0.5 truncate">{fmtDayDate(v.scheduledFor)} · {v.slot}{v.usesPlan ? " · on your plan" : ""}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          {late ? <span className="chip chip-warn">Needs a new day</span> : <StatusPill status={v.status} />}
                          {ins && <div className="t-small mt-1 flex items-center justify-end gap-1"><BadgeCheck size={11} className="text-accent" /> {ins.name}</div>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {upcoming.length > 6 && <Link href="/app/visits" className="t-small block border-t border-line px-5 py-3 text-center font-medium text-accent">All {upcoming.length} booked visits</Link>}
          </Panel>
        </Reveal>

        <Reveal delay={0.05}>
          <Panel className="h-full">
            <PanelHead title="Recent activity" meta="Everything, in order" action={<Link href="/app/activity" className="btn btn-pill btn-sm">All</Link>} />
            <ul className="divide-y divide-line">
              {events.slice(0, 6).map((e) => (
                <li key={e.id}>
                  <Link href={e.href as Route} className="flex gap-3 px-5 py-3.5 transition hover:bg-paper">
                    <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", e.readAt ? "bg-line-2" : "bg-accent")} />
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium">{e.title}</div>
                      <div className="t-small truncate">{e.body}</div>
                    </div>
                    <span className="t-small ml-auto shrink-0 whitespace-nowrap">{relative(e.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      </div>

      {/* ── the quiet promise, restated where it matters ────── */}
      <Reveal>
        <section className="card border border-accent/15 bg-accent-tint p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-accent shadow-card"><MapPin size={17} /></span>
            <p className="min-w-0 flex-1 text-[14.5px] leading-relaxed text-accent-2">
              Every photograph in your reports is GPS- and time-stamped and shown only to you — and to anyone you share a report with. No repair is ever started without your approval.
            </p>
            <Link href="/app/help" className="btn btn-pill btn-sm shrink-0 border-accent/20">How it works</Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
