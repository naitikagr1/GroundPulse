import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BadgeCheck, CalendarClock, Check, ClipboardList, Clock, FileText,
  Hourglass, KeyRound, MapPin, MessageSquare, Phone, Star, Video, Wrench, XCircle,
} from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { isOverdue, visitView } from "@/lib/queries";
import { Panel, PanelHead, StatusPill, money, visitLook } from "@/components/app/ui";
import { PayButton } from "@/components/app/PayButton";
import { VisitActions } from "@/components/app/VisitActions";
import { EntryCode } from "@/components/app/EntryCode";
import { IssueCard } from "@/components/app/IssueCard";
import { AutoRefresh } from "@/components/app/AutoRefresh";
import { RateVisit } from "@/components/app/RateVisit";
import { TicketForm } from "@/components/app/TicketForm";
import { Reveal } from "@/components/ui/Reveal";
import { blocksFor, itemCount } from "@/lib/checklist";
import { fmtDateTime, fmtDayDate, fmtTime, relative, slotInZone, todayKey } from "@/lib/format";
import { quote } from "@/lib/quote";
import { telHref } from "@/lib/phone";
import { planName } from "@/lib/plans";
import { checkInWords } from "@/lib/geo";
import { cn } from "@/lib/cn";
import type { VisitStatus } from "@/lib/types";

/* The five things that happen to a visit, in the order they happen. */
const TRACK: { s: VisitStatus; t: string; b: string }[] = [
  { s: "scheduled", t: "Booked", b: "We have the day and the window" },
  { s: "assigned", t: "Inspector assigned", b: "Name, photo and record shared with you" },
  { s: "en_route", t: "On the way", b: "You see it here the moment they leave" },
  { s: "on_site", t: "On site", b: "Entered with your code, walking the checklist" },
  { s: "ready", t: "Report delivered", b: "Within the hour of them leaving" },
];
const ORDER: VisitStatus[] = ["scheduled", "assigned", "en_route", "on_site", "submitted", "ready", "closed"];

export default async function Page({ params, searchParams }: PageProps<"/app/visits/[id]">) {
  const user = await requireOwner();
  const { id } = await params;
  const sp = await searchParams;
  const view = await visitView(user.id, id);
  if (!view) notFound();

  const { visit: v, property: p, inspector, report, heldForReview, invoice, advance, balance, subscription, tickets, live, liveInvoices, coverSub } = view;
  const unpaid = v.status === "unpaid";
  const cancelled = v.status === "cancelled";
  const reached = ORDER.indexOf(v.status);
  const look = visitLook(v.status);
  const blocks = blocksFor(p, v);
  const movable = ["unpaid", "scheduled", "assigned"].includes(v.status);
  const overdue = isOverdue(v);
  const today = v.scheduledFor === todayKey();
  const beforeEntry = ["unpaid", "scheduled", "assigned", "en_route"].includes(v.status);

  /* What the owner was shown when they booked is what they see now. Older
     bookings made before the lines were kept are priced again, with the
     launch offer applied if it was one. */
  const lines = v.lines.length
    ? v.lines
    : quote({ kind: v.kind, planId: v.planId, size: p.size, tierId: v.tierId, addOns: v.addOns, founding: v.founding, rooms: p.rooms }).lines;
  const costMeta = v.founding ? "Free · launch offer"
    : invoice ? (invoice.status === "paid" ? "Paid" : invoice.status === "due" ? "Billed · due" : invoice.status === "refund_due" ? "Being refunded" : "Refunded")
    : cancelled ? (advance ? "Being refunded" : "Nothing charged")
    : v.amountInr === 0 ? "On your plan"
    : unpaid ? "Due to confirm"
    : advance ? (advance.amountInr < v.amountInr ? "Part paid · the rest when the report is ready" : "Paid")
    : "Billed after the visit";

  const cancelNote = [
    v.founding ? "Your free inspection comes back to you." : advance?.status === "paid" ? `The ${money(advance.amountInr)} you paid goes back to the card or UPI it came from.` : "Nothing is charged.",
    subscription && subscription.status === "pending" && subscription.startedByVisitId === v.id ? `This is the visit that starts ${planName(subscription.planId)} — cancelling it cancels the plan and the rest of its booked visits, and nothing is billed.` : "",
    v.usesPlan && !(subscription?.startedByVisitId === v.id && subscription.status === "pending") ? "The plan inspection goes back on your plan to book another day." : "",
  ].filter(Boolean).join(" ");

  const blocked = !movable ? null
    : overdue ? null
    : today && !v.missedAt ? "The visit is today. On the day itself a visit can no longer be moved or cancelled — the inspector is already committed to it."
    : null;

  return (
    <>
      <Link href="/app/visits" className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2 transition hover:text-ink"><ArrowLeft size={14} /> Visits</Link>

      {/* decisions sent live from the property — the page keeps itself current */}
      {v.status === "on_site" && <AutoRefresh every={15} />}
      {live.length > 0 && (
        <Reveal className="mb-4">
          <section id="live" className="scroll-mt-24">
            <h2 className="serif text-[22px] tracking-[-0.03em]">From your property{v.status === "on_site" ? ", right now" : ""}</h2>
            <p className="t-small mt-1 mb-3 leading-snug">
              {v.status === "on_site"
                ? "Your inspector found these while inside, and can ring you about them. Decide each within the hour — if you approve, it is done on this visit, with them there."
                : "What your inspector sent you from this visit, and what came of it."}
            </p>
            <div className="grid gap-4">
              {live.map((i) => <IssueCard key={i.id} issue={i} founding={v.founding === true} sub={coverSub} invoice={liveInvoices[i.id]} tz={user.tz} />)}
            </div>
          </section>
        </Reveal>
      )}

      {/* we did not turn up — the owner chooses, free */}
      {v.missedAt && movable && (
        <Reveal className="mb-4">
          <div className="card border border-fail/25 bg-fail-soft p-5">
            <div className="text-[15.5px] font-semibold">Our inspector could not make it — we are sorry.</div>
            <p className="t-small mt-1 leading-snug">Move this visit to a new day at no charge, or cancel it and everything you paid for it comes back. Both are below.</p>
          </div>
        </Reveal>
      )}

      {/* booked, not yet confirmed: the payment */}
      {unpaid && (
        <Reveal className="mb-4">
          <div className="card grid gap-3 border border-warn/30 bg-warn-soft p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="text-[15.5px] font-semibold">Pay {money(v.advanceInr)} to confirm this visit</div>
              <p className="t-small mt-1 leading-snug">{v.advanceInr < v.amountInr ? <>The other {money(v.amountInr - v.advanceInr)} is due when the report is ready.</> : <>That is the full price — nothing more is due after the visit.</>} Nobody is sent until it is paid.</p>
            </div>
            <PayButton purpose="advance" refId={v.id} amount={v.advanceInr} autoStart={sp.pay === "1"} className="sm:min-w-[220px]" />
          </div>
        </Reveal>
      )}
      {/* the report is in, the balance is not */}
      {balance && report && (
        <Reveal className="mb-4">
          <div className="card grid gap-3 border border-accent/25 bg-accent-tint p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="text-[15.5px] font-semibold">Your report is ready — health {report.score}</div>
              <p className="t-small mt-1 leading-snug">Pay the remaining {money(balance.amountInr)} to open all of it: photos, video, notes and repair prices.</p>
            </div>
            <PayButton purpose="invoice" refId={balance.id} amount={balance.amountInr} label={`Pay ${money(balance.amountInr)}`} className="sm:min-w-[220px]" />
          </div>
        </Reveal>
      )}

      {sp.new === "1" && !cancelled && !unpaid && (
        <Reveal className="mb-4">
          <div className="card flex items-center gap-3 border border-pass/30 bg-pass-soft p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pass text-white"><Check size={16} strokeWidth={3} /></span>
            <p className="text-[14.5px] font-medium text-[#157a44]">Booked. We are finding an inspector for that window now — you will get their name and record before the day. Your entry code is below.</p>
          </div>
        </Reveal>
      )}
      {cancelled && (
        <Reveal className="mb-4">
          <div className="card flex items-center gap-3 border border-line bg-white p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-beige text-text-2"><XCircle size={17} /></span>
            <p className="text-[14.5px] font-medium">Cancelled{v.cancelledAt ? ` ${relative(v.cancelledAt)}` : ""}. {invoice?.status === "refund_due" || advance?.status === "refund_due" ? "What you paid is being refunded — you will see it on Billing." : advance?.status === "refunded" ? `Your ${money(advance.amountInr)} advance has been refunded to where it came from.` : "Nothing is charged for it."}</p>
          </div>
        </Reveal>
      )}

      <Reveal>
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="grow basis-[15rem]">
              <div className="t-label font-mono">{v.ref}</div>
              <h1 className="serif mt-1 text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.06] tracking-[-0.035em]">
                {v.kind === "cleaning" ? "Cleaning" : v.kind === "plot" ? "Plot visit" : "Inspection"} · {p.label}
              </h1>
              <div className="t-small mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5"><Clock size={12} /> {fmtDayDate(v.scheduledFor)} · {v.slot} IST{slotInZone(v.scheduledFor, v.slot, user.tz) ? ` (${slotInZone(v.scheduledFor, v.slot, user.tz)} your time)` : ""}</span>
                <span className="flex items-center gap-1.5"><MapPin size={12} /> {p.address}</span>
              </div>
            </div>
            {overdue ? <span className="chip chip-warn">Needs a new day</span> : heldForReview ? <span className="chip chip-warn">Report being checked</span> : <StatusPill status={v.status} />}
          </div>

          {/* ── the track ────────────────────────────────── */}
          {!cancelled && (
            <div className="border-t border-line px-6 py-6">
              <ol className="grid gap-0 sm:grid-cols-5">
                {TRACK.map((step, i) => {
                  const at = ORDER.indexOf(step.s);
                  const done = reached >= at;
                  const current = (step.s === "ready" ? reached >= ORDER.indexOf("ready") : reached === at) || (step.s === "on_site" && v.status === "submitted");
                  return (
                    <li key={step.s} className="relative flex gap-3 pb-6 sm:block sm:pb-0">
                      <div className="flex flex-col items-center sm:flex-row">
                        <span className={cn("relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition",
                          done ? "bg-accent text-white" : "bg-beige-2 text-text-3", current && look.live && "ring-4 ring-accent/15")}>
                          {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                        </span>
                        <span className={cn("w-px flex-1 sm:h-px sm:w-full", done && reached > at ? "bg-accent" : "bg-line", "sm:mx-1")} />
                      </div>
                      <div className="pb-1 sm:mt-3 sm:pr-3">
                        <div className={cn("text-[13.5px] font-semibold", done ? "text-ink" : "text-text-3")}>{step.t}</div>
                        <div className="t-small mt-0.5 leading-snug">{step.b}</div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {overdue && (
                <div className="mt-4 flex items-start gap-3 rounded-[14px] bg-warn-soft p-4">
                  <CalendarClock size={16} className="mt-0.5 shrink-0 text-warn" />
                  <p className="min-w-0 flex-1 text-[14px] text-text-2">{fmtDayDate(v.scheduledFor)} went by and nobody could make it — that is on us, not you. Pick a new day below; moving it is free, and so is cancelling.</p>
                </div>
              )}
              {v.status === "on_site" && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] bg-accent-tint p-4">
                  <span className="ping relative h-2 w-2 rounded-full bg-accent text-accent" />
                  <p className="min-w-0 flex-1 text-[14px] text-accent-2">
                    Entered at {v.startedAt ? fmtTime(v.startedAt) : "—"} IST with your code. Walking {itemCount(p, v)} items across {blocks.length} areas — the report follows within the hour.
                  </p>
                </div>
              )}
              {heldForReview && (
                <div className="mt-4 flex items-start gap-3 rounded-[14px] bg-warn-soft p-4">
                  <Hourglass size={16} className="mt-0.5 shrink-0 text-warn" />
                  <p className="min-w-0 flex-1 text-[14px] text-text-2">The checklist is done. {inspector?.name ?? "Your inspector"} is in their first months with us, so a person reads every report before it reaches you — it lands here as soon as they have, usually within a few hours.</p>
                </div>
              )}
              {report && (
                <Link href={`/app/reports/${report.id}` as Route} className="btn btn-accent mt-4 w-full sm:w-auto"><FileText size={16} /> Open the report <ArrowRight size={15} /></Link>
              )}
            </div>
          )}

          {/* ── the code for the door ─────────────────────── */}
          {!cancelled && beforeEntry && (
            <div className="border-t border-line p-4">
              <EntryCode code={v.otp} property={p.label} when={`${fmtDayDate(v.scheduledFor)}, ${v.slot} IST`} keyHolder={p.keyHolderName || undefined} inspector={inspector?.name} />
            </div>
          )}
          {/* the second code, that closes the visit — for whoever takes the keys back */}
          {!cancelled && v.exitCode && (beforeEntry || v.status === "on_site") && (
            <div className="border-t border-line p-4">
              <EntryCode kind="exit" code={v.exitCode} property={p.label} when={`${fmtDayDate(v.scheduledFor)}, ${v.slot} IST`} keyHolder={p.keyHolderName || undefined} inspector={inspector?.name} compact={beforeEntry} />
            </div>
          )}
          {v.checkIn && (
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5 text-[13.5px] text-text-2">
              <KeyRound size={14} className="text-accent" /> Your code was used at {fmtTime(v.checkIn.at)} IST · {checkInWords(v.checkIn).long}
              {v.checkIn.note && <span className="w-full italic">“{v.checkIn.note}”</span>}
            </div>
          )}

          {movable && <VisitActions id={v.id} slot={v.slot} blocked={blocked} cancelNote={cancelNote} tz={user.tz} />}
        </Panel>
      </Reveal>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-4">
          {/* ── who is coming ─────────────────────────────── */}
          {!cancelled && (
            <Reveal>
              <Panel>
                <PanelHead title="Your inspector" meta={inspector ? "Police-verified · background checked" : "Being assigned"} />
                {inspector ? (
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-[17px] font-semibold text-white">{inspector.initials}</span>
                      <div className="grow basis-[15rem]">
                        <div className="flex items-center gap-1.5 text-[17px] font-semibold">{inspector.name} <BadgeCheck size={16} className="text-accent" /></div>
                        <div className="t-small mt-0.5">{inspector.bg} · with us since {inspector.since}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1 text-[15px] font-medium tabular-nums"><Star size={13} className="fill-gold text-gold" /> {inspector.rating}</div>
                        <div className="t-small">{inspector.visits} visits</div>
                      </div>
                    </div>
                    <div className="t-small mt-4 rounded-[12px] bg-paper p-3.5 leading-relaxed">
                      Works {inspector.area}. At the door they ask for your entry code — the checklist does not open without it, so no visit starts that you did not let in.
                    </div>
                    {["en_route", "on_site"].includes(v.status) && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <a href={telHref(inspector.phone)} className="btn btn-white btn-sm"><Phone size={14} /> Call {inspector.name.split(" ")[0]}</a>
                        <a href={`sms:${telHref(inspector.phone).slice(4)}`} className="btn btn-white btn-sm"><MessageSquare size={14} /> Message</a>
                      </div>
                    )}
                    {["ready", "closed"].includes(v.status) && (
                      <div className="mt-4 border-t border-line pt-4"><RateVisit id={v.id} inspector={inspector.name} done={v.rating} /></div>
                    )}
                  </div>
                ) : (
                  <p className="t-small px-5 py-8 text-center">We assign by locality, not by whoever is free. You will see their name, record and rating here before the visit — usually a day or two ahead.</p>
                )}
              </Panel>
            </Reveal>
          )}

          {/* ── what they will walk ───────────────────────── */}
          <Reveal delay={0.05}>
            <Panel>
              <PanelHead title="What gets checked" meta={`${blocks.length} areas · ${itemCount(p, v)} items`} />
              <ul className="grid gap-px bg-line sm:grid-cols-2">
                {blocks.map((b) => (
                  <li key={b.name} className="bg-white px-5 py-3.5">
                    <div className="flex items-center gap-2 text-[14px] font-medium"><ClipboardList size={13} className="text-accent" /> {b.name}</div>
                    <div className="t-small mt-1 leading-snug">{b.items.join(" · ")}</div>
                  </li>
                ))}
              </ul>
              {v.planService && (
                <div className="flex items-start gap-2.5 border-t border-line px-5 py-3.5 text-[13.5px] text-accent-2">
                  <Wrench size={15} className="mt-0.5 shrink-0 text-accent" /> <span>Maintenance service on this visit (Care+): {v.planService}</span>
                </div>
              )}
              {v.recording && (
                <div className="flex items-center gap-2.5 border-t border-line px-5 py-3.5 text-[13.5px] text-accent-2">
                  <Video size={15} className="text-accent" /> The whole visit is filmed on a body camera — the video comes with the report.
                </div>
              )}
              {v.liveCall && (
                <div className="flex items-center gap-2.5 border-t border-line px-5 py-3.5 text-[13.5px] text-accent-2">
                  <Phone size={15} className="text-accent" /> You asked for a live call — the inspector will ring you from inside.
                </div>
              )}
              {v.notes && (
                <div className="border-t border-line px-5 py-4">
                  <div className="t-label">Your instructions</div>
                  <p className="mt-1 text-[14.5px] leading-relaxed">{v.notes}</p>
                </div>
              )}
            </Panel>
          </Reveal>
        </div>

        <div className="grid gap-4 self-start">
          <Reveal>
            <Panel>
              <PanelHead title="What this costs" meta={costMeta} />
              <div className="p-5">
                <ul className="grid gap-3">
                  {lines.map((l) => (
                    <li key={l.k} className="flex items-start justify-between gap-3">
                      <span className="min-w-0"><span className="block text-[14px] font-medium">{l.k}</span><span className="t-small block leading-snug">{l.note}</span></span>
                      <span className="shrink-0 text-right text-[14px] font-medium tabular-nums">
                        {l.was !== undefined && <span className="mr-1.5 font-normal text-text-3 line-through">{money(l.was)}</span>}
                        {l.v === 0 ? (l.was !== undefined ? "free" : "₹0") : money(l.v)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                  <span className="text-[14px] font-medium">Total</span>
                  <span className="text-[22px] font-medium tabular-nums tracking-[-0.03em]">{cancelled ? "₹0" : v.amountInr ? money(v.amountInr) : v.founding ? "Free" : "₹0"}</span>
                </div>
                {invoice && <p className="t-small mt-2">{invoice.ref} · {invoice.method || (invoice.status === "due" ? "payable whenever suits you" : "")}</p>}
                <Link href="/app/billing" className="btn btn-white btn-sm mt-4 w-full">See billing</Link>
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={0.05}>
            <Panel>
              <PanelHead title="Getting in" meta={p.label} />
              <div className="grid gap-4 px-5 py-4">
                <div>
                  <div className="t-label">Access</div>
                  <p className="mt-1 text-[14.5px] leading-relaxed">{p.accessNote || <span className="text-text-3">Nothing noted.</span>}</p>
                </div>
                {p.keyHolderName && (
                  <div>
                    <div className="t-label">Key holder</div>
                    <p className="mt-1 flex items-center gap-2 text-[14.5px]"><KeyRound size={14} className="text-text-3" /> {p.keyHolderName} · {p.keyHolderPhone}</p>
                  </div>
                )}
                <Link href={`/app/properties/${p.id}` as Route} className="btn btn-pill btn-sm justify-self-start">Edit these details</Link>
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={0.08}>
            <Panel className="p-4">
              {tickets.map((t) => (
                <div key={t.id} className="mb-3 rounded-[12px] border border-line p-3.5 text-[13.5px]">
                  <div className="flex items-center justify-between gap-2"><span className="font-medium">{t.topic} · {t.ref}</span><span className={cn("chip", t.status === "answered" ? "chip-pass" : t.status === "open" ? "chip-warn" : "")}>{t.status === "open" ? "With us" : t.status === "answered" ? "Replied" : "Closed"}</span></div>
                  <p className="t-small mt-1 leading-snug">{t.body}</p>
                  {t.reply && <p className="mt-2 rounded-[10px] bg-accent-tint px-3 py-2 leading-snug text-accent-2"><b>StillYours:</b> {t.reply}{t.repliedAt ? <span className="t-small block">{fmtDateTime(t.repliedAt)}</span> : null}</p>}
                </div>
              ))}
              <TicketForm visitId={v.id} />
            </Panel>
          </Reveal>

          <p className="t-small px-1">
            Booked {relative(v.createdAt)}. Moving or cancelling is free until the day before the visit.
          </p>
        </div>
      </div>
    </>
  );
}
