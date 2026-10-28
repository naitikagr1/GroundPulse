import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarClock, CheckCircle2, FileText, Gift, IndianRupee, KeyRound, LogOut, MessageSquare, Phone, UserRound, Wrench,
} from "lucide-react";
import { isOps } from "@/lib/auth";
import { APPS_LIVE } from "@/lib/flags";
import { netPay, opsView } from "@/lib/ops";
import {
  assignVisit, attachQuote, advanceRepair, cancelFreeVisit, cancelVisitOps, closeTicket, markPaid, markPayoutSent, markRefunded,
  opsLogout, releaseReport, replyTicket, setInspectorStatus, unlockCheckIn, waivePenalty,
} from "@/lib/opsActions";
import { STATUS_COPY } from "@/lib/field";
import { penaltyLine } from "@/lib/jobs";
import { DEPOSIT } from "@/lib/payout";
import { BEFORE_APP, LIMIT } from "@/lib/offer";
import { prettyPhone } from "@/lib/phone";
import { fmtDate, fmtDayDate, relative } from "@/lib/format";
import { Panel, PanelHead, Stat, money } from "@/components/app/ui";
import { cn } from "@/lib/cn";
import type { InspectorStatus, Visit } from "@/lib/types";
import { ActionForm, ConfirmForm, OpsLogin } from "./forms";

export const metadata: Metadata = { title: "Ops", robots: { index: false, follow: false } };

const STATUSES = Object.keys(STATUS_COPY) as InspectorStatus[];
const kindLabel = (v: Visit) => (v.kind === "cleaning" ? "Cleaning" : v.kind === "plot" ? "Plot" : "Inspection");
const field = "h-9 w-full min-w-0 rounded-[10px] border border-line-2 bg-white px-3 text-[13.5px] outline-none focus:border-accent";
const tel = (p: string) => `tel:${p.startsWith("+") ? p : `+91${p}`}`;

/* One page, one password. Everything on it is something the two apps are
   waiting on a person for; a section with nothing in it is not shown. */
export default async function Ops() {
  if (!APPS_LIVE) notFound();
  if (!(await isOps())) return <OpsLogin />;

  const o = await opsView();
  const payTotal = o.pay.reduce((n, x) => n + x.total, 0);
  const waiting = o.locked.length + o.unassigned.length + o.pay.length + o.review.length + o.tickets.length + o.money.length + o.quotes.length + o.repairs.length;

  return (
    <main className="min-h-dvh bg-paper">
      <div className="mx-auto grid max-w-[920px] gap-4 px-4 py-6 [&>*]:min-w-0">
        <header>
          <div className="flex items-center justify-between gap-3">
            <p className="t-label min-w-0">StillYours ops · {fmtDayDate(new Date().toISOString())}</p>
            <form action={opsLogout} className="shrink-0"><button className="btn btn-white btn-sm"><LogOut size={14} /> Lock</button></form>
          </div>
          <h1 className="serif mt-1.5 text-[clamp(1.7rem,5vw,2.2rem)] leading-[1.06] tracking-[-0.035em]">
            {waiting ? `${waiting} thing${waiting === 1 ? "" : "s"} waiting on you.` : "Nothing waiting on you."}
          </h1>
        </header>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat n={money(payTotal)} l={`To send · ${o.pay.length} inspector${o.pay.length === 1 ? "" : "s"}`} tone={payTotal ? "accent" : undefined} className="border border-line bg-white" />
          <Stat n={o.unassigned.length} l="Need an inspector" tone={o.unassigned.length ? "warn" : undefined} className="border border-line bg-white" />
          <Stat n={o.review.length} l="Reports to read" tone={o.review.length ? "warn" : undefined} className="border border-line bg-white" />
          <Stat n={o.tickets.length} l="Messages" tone={o.tickets.length ? "warn" : undefined} className="border border-line bg-white" />
        </div>

        {/* ── stuck at the door ─────────────────────────────── */}
        {o.locked.length > 0 && (
          <Panel className="border-fail/30">
            <PanelHead wrapMeta title={<span className="flex items-center gap-2 text-fail"><KeyRound size={15} /> Locked at the door</span>} meta="Five wrong codes. Call the owner, then unlock." />
            <ul className="divide-y divide-line">
              {o.locked.map(({ v, property, inspector, ownerPhone }) => (
                <li key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="grow basis-[16rem]">
                    <div className="text-[14.5px] font-medium">{property?.label} · <span className="font-mono text-[13px]">{v.ref}</span></div>
                    <div className="t-small">{inspector?.name} is there · {v.slot}</div>
                  </div>
                  {ownerPhone && <a href={tel(ownerPhone)} className="btn btn-white btn-sm"><Phone size={13} /> Owner</a>}
                  <form action={unlockCheckIn}><input type="hidden" name="id" value={v.id} /><button className="btn btn-accent btn-sm">Unlock</button></form>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* ── nobody on it ──────────────────────────────────── */}
        {o.unassigned.length > 0 && (
          <Panel>
            <PanelHead wrapMeta title={<span className="flex items-center gap-2"><CalendarClock size={15} /> Needs an inspector</span>} meta={`Today and the next two days, and anything missed`} />
            <ul className="divide-y divide-line">
              {o.unassigned.map(({ v, property, ownerPhone, gone, who }) => (
                <li key={v.id} className="grid gap-2 px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-[14.5px] font-medium">{property?.label ?? "—"} · <span className="font-mono text-[13px]">{v.ref}</span></div>
                    <div className="flex flex-wrap gap-1.5">
                      {v.missedAt && <span className="chip chip-fail">Missed</span>}
                      {gone && <span className="chip chip-warn">Day gone</span>}
                      <span className="chip">{kindLabel(v)}</span>
                    </div>
                  </div>
                  <div className="t-small">{fmtDayDate(v.scheduledFor)} · {v.slot} · {property?.locality}, {property?.city}{ownerPhone && <> · <a href={tel(ownerPhone)} className="underline underline-offset-2">{prettyPhone(ownerPhone)}</a></>}</div>
                  <div className="flex flex-wrap items-start gap-3">
                    {!gone && (
                      <ActionForm action={assignVisit} submit="Assign" className="grow basis-[16rem]">
                        <input type="hidden" name="id" value={v.id} />
                        <select name="inspectorId" required defaultValue="" className={field}>
                          <option value="" disabled>{who.length ? "Pick an inspector" : "Nobody in this city can work"}</option>
                          {who.map((i) => <option key={i.id} value={i.id}>{i.name} · {STATUS_COPY[i.status].label}</option>)}
                        </select>
                      </ActionForm>
                    )}
                    {(gone || v.missedAt) && (
                      <ConfirmForm action={cancelVisitOps} ask={`Cancel ${v.ref}? Speak to the owner first — anything they paid goes back.`} className="pt-0.5">
                        <input type="hidden" name="id" value={v.id} />
                        <button className="btn btn-white btn-sm">Cancel visit</button>
                      </ConfirmForm>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* ── free inspections: call, and cancel what is not genuine ── */}
        {o.free.open.length > 0 && (
          <Panel>
            <PanelHead
              wrapMeta
              title={<span className="flex items-center gap-2"><Gift size={15} /> Free inspections</span>}
              meta={`${o.free.booked} of ${LIMIT} booked, ${BEFORE_APP} of them on WhatsApp · call each owner before the day`}
            />
            <ul className="divide-y divide-line">
              {o.free.open.map(({ v, property, owner, ownerPhone, inspector, inspectorPhone }) => {
                const who = owner?.name || "the owner";
                const job = inspector ? ` ${inspector.name} has accepted it and loses the job — call them.` : "";
                return (
                  <li key={v.id} className="grid gap-2 px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="text-[14.5px] font-medium">{property?.label ?? "—"} · <span className="font-mono text-[13px]">{v.ref}</span></div>
                      <div className="flex flex-wrap gap-1.5">
                        {property && <span className="chip">{property.size} BHK</span>}
                        <span className={cn("chip", inspector ? "chip-accent" : "chip-warn")}>{inspector ? `Accepted · ${inspector.name}` : "No inspector yet"}</span>
                      </div>
                    </div>
                    <div className="t-small">
                      {owner?.name || "No name"}
                      {ownerPhone && <> · <a href={tel(ownerPhone)} className="underline underline-offset-2">{prettyPhone(ownerPhone)}</a></>}
                      {owner?.email && <> · {owner.email}</>}
                      {owner && <> · signed up {relative(owner.createdAt)}</>}
                    </div>
                    <div className="t-small">{fmtDayDate(v.scheduledFor)} · {v.slot} · {property?.address}{property?.city && `, ${property.city}`} · booked {relative(v.createdAt)}</div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {inspectorPhone && <a href={tel(inspectorPhone)} className="btn btn-white btn-sm"><Phone size={13} /> {inspector?.name}</a>}
                      <ConfirmForm action={cancelFreeVisit} ask={`Cancel ${v.ref}? The place goes back to the ${LIMIT}, and ${who} can book their free inspection again.${job}`}>
                        <input type="hidden" name="id" value={v.id} />
                        <button className="btn btn-white btn-sm">Cancel</button>
                      </ConfirmForm>
                      <ConfirmForm action={cancelFreeVisit} ask={`Cancel ${v.ref} as not genuine? The place goes back to the ${LIMIT}, and this account can never book a free inspection again.${job}`}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="fake" value="1" />
                        <button className="btn btn-white btn-sm border-fail/30 text-fail">Cancel as fake</button>
                      </ConfirmForm>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}

        {/* ── pay ───────────────────────────────────────────── */}
        {o.pay.length > 0 && (
          <Panel>
            <PanelHead wrapMeta title={<span className="flex items-center gap-2"><IndianRupee size={15} /> Pay inspectors</span>} meta="Send to their UPI, then mark it sent" />
            <ul className="divide-y divide-line">
              {o.pay.map(({ ins, jobs, refunds, total }) => (
                <li key={ins.id} className="grid gap-2.5 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[14.5px] font-medium">{ins.name || prettyPhone(ins.phone)}</div>
                      {ins.upiId
                        ? <div className="t-small font-mono">{ins.upiId}</div>
                        : <div className="t-small text-fail">No UPI on their profile — ask them to add it</div>}
                    </div>
                    <div className="text-[22px] font-medium tabular-nums tracking-[-0.03em]">{money(total)}</div>
                  </div>
                  <ul className="grid gap-1 text-[13px]">
                    {jobs.map((v) => (
                      <li key={v.id} className="flex flex-wrap justify-between gap-x-3">
                        <span className="text-text-2"><span className="font-mono">{v.ref}</span> · {fmtDate(v.scheduledFor)}</span>
                        <span className="tabular-nums">
                          {money(v.payoutInr)}
                          {(v.overtimeInr ?? 0) > 0 && <> + {money(v.overtimeInr)} OT</>}
                          {(v.depositHeldInr ?? 0) > 0 && <span className="text-text-3"> − {money(v.depositHeldInr!)} deposit</span>}
                          {" = "}<b>{money(netPay(v))}</b>
                        </span>
                      </li>
                    ))}
                    {refunds.map((p) => (
                      <li key={p.id} className="flex justify-between gap-3">
                        <span className="text-text-2">Deduction taken back · <span className="font-mono">{p.ref}</span></span>
                        <b className="shrink-0 tabular-nums">{money(p.refundInr ?? 0)}</b>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {ins.upiId && (
                      <a href={`upi://pay?pa=${encodeURIComponent(ins.upiId)}&pn=${encodeURIComponent(ins.name)}&am=${total}&cu=INR&tn=${encodeURIComponent("StillYours pay")}`} className="btn btn-white btn-sm">
                        Open in UPI app
                      </a>
                    )}
                    <ConfirmForm action={markPayoutSent} ask={`Mark ${money(total)} as sent to ${ins.name}?`}>
                      <input type="hidden" name="inspectorId" value={ins.id} />
                      <input type="hidden" name="visitIds" value={jobs.map((v) => v.id).join(",")} />
                      <input type="hidden" name="penaltyIds" value={refunds.map((p) => p.id).join(",")} />
                      <button className="btn btn-accent btn-sm"><CheckCircle2 size={14} /> Sent {money(total)}</button>
                    </ConfirmForm>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* ── probation reports ─────────────────────────────── */}
        {o.review.length > 0 && (
          <Panel>
            <PanelHead wrapMeta title={<span className="flex items-center gap-2"><FileText size={15} /> Reports to read</span>} meta="On probation — the owner sees nothing until you release it" />
            <ul className="divide-y divide-line">
              {o.review.map(({ r, property, inspector, flagged }) => (
                <li key={r.id} className="grid gap-2 px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-[14.5px] font-medium">{property?.label} · <span className="font-mono text-[13px]">{r.ref}</span></div>
                    <span className="t-small">{inspector?.name} · score {r.score} · {r.counts.pass} ok, {r.counts.attn} attention, {r.counts.fail} fail</span>
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-text-2">{r.summary}</p>
                  {flagged.length > 0 && (
                    <ul className="grid gap-1 rounded-[10px] bg-paper px-3 py-2.5 text-[13px]">
                      {flagged.map((f) => (
                        <li key={`${f.room}-${f.t}`}>
                          <span className={cn("font-medium", f.s === "fail" ? "text-fail" : "text-warn")}>{f.room} · {f.t}</span>
                          {f.note && <span className="text-text-2"> — {f.note}</span>}
                          <span className="text-text-3"> · {(f.photos ?? []).length} photo{(f.photos ?? []).length === 1 ? "" : "s"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="t-small">{r.gps} · {r.videos} · on site {r.onSite}</p>
                  <ConfirmForm action={releaseReport} ask={`Release ${r.ref} to the owner?`}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-accent btn-sm">Release to the owner</button>
                  </ConfirmForm>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* ── messages ──────────────────────────────────────── */}
        {o.tickets.length > 0 && (
          <Panel>
            <PanelHead wrapMeta title={<span className="flex items-center gap-2"><MessageSquare size={15} /> Messages</span>} meta="From owners, oldest first" />
            <ul className="divide-y divide-line">
              {o.tickets.map(({ t, owner, property }) => (
                <li key={t.id} className="grid gap-2 px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="text-[14.5px] font-medium">{t.topic} · <span className="font-mono text-[13px]">{t.ref}</span></div>
                    <span className="t-small">{owner?.name}{property ? ` · ${property.label}` : ""} · {relative(t.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-text-2">{t.body}</p>
                  <ActionForm action={replyTicket} submit="Send reply" pending="Sending…">
                    <input type="hidden" name="id" value={t.id} />
                    <textarea name="reply" rows={3} required minLength={5} placeholder="Your reply — the owner sees it in the app"
                      className="w-full rounded-[10px] border border-line-2 bg-white px-3 py-2 text-[13.5px] leading-snug outline-none focus:border-accent" />
                  </ActionForm>
                  <form action={closeTicket}><input type="hidden" name="id" value={t.id} /><button className="t-small underline underline-offset-2">Close without replying</button></form>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* ── money in and out ──────────────────────────────── */}
        {o.money.length > 0 && (
          <Panel>
            <PanelHead wrapMeta title={<span className="flex items-center gap-2"><IndianRupee size={15} /> Bills</span>} meta="UPI payments to confirm, refunds to send" />
            <ul className="divide-y divide-line">
              {o.money.map(({ i, owner, property }) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="grow basis-[16rem]">
                    <div className="text-[14.5px] font-medium">{i.title} · <b className="tabular-nums">{money(i.amountInr)}</b></div>
                    <div className="t-small"><span className="font-mono">{i.ref}</span> · {owner?.name} · {property?.label}</div>
                  </div>
                  {i.status === "due" ? (
                    <form action={markPaid} className="flex gap-2">
                      <input type="hidden" name="id" value={i.id} />
                      <input name="utr" placeholder="UTR" className={cn(field, "w-28")} />
                      <button className="btn btn-accent btn-sm">Received</button>
                    </form>
                  ) : (
                    <ConfirmForm action={markRefunded} ask={`Has the refund of ${money(i.amountInr)} gone out?`}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className="btn btn-accent btn-sm">Refund sent</button>
                    </ConfirmForm>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* ── quotes and repairs ────────────────────────────── */}
        {(o.quotes.length > 0 || o.repairs.length > 0) && (
          <Panel>
            <PanelHead wrapMeta title={<span className="flex items-center gap-2"><Wrench size={15} /> Repairs</span>} meta="Price what the inspector could not, and confirm the owner's day" />
            <ul className="divide-y divide-line">
              {o.quotes.map(({ i, property }) => (
                <li key={i.id} className="grid gap-2 px-5 py-4">
                  <div className="text-[14.5px] font-medium">
                    <span className={i.severity === "fail" ? "text-fail" : "text-warn"}>{i.title}</span> · {i.room} · {property?.label} · <span className="font-mono text-[13px]">{i.ref}</span>
                  </div>
                  {i.body && <p className="text-[13px] text-text-2">{i.body}</p>}
                  <ActionForm action={attachQuote} submit="Send quote to the owner" pending="Sending…">
                    <input type="hidden" name="id" value={i.id} />
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <input name="provider" required placeholder="Who does it" className={field} />
                      <input name="trade" required placeholder="Trade, e.g. Plumber" className={field} />
                      <input name="labour" inputMode="numeric" placeholder="Labour ₹" className={field} />
                      <input name="parts" inputMode="numeric" placeholder="Parts ₹" className={field} />
                    </div>
                    <label className="t-small mt-2 flex items-center gap-2">
                      <input type="checkbox" name="coverEligible" defaultChecked={i.coverEligible} className="h-4 w-4 accent-[var(--accent)]" /> Care+ can cover it
                    </label>
                  </ActionForm>
                </li>
              ))}
              {o.repairs.map(({ i, property }) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="grow basis-[16rem]">
                    <div className="text-[14.5px] font-medium">{i.title} · {property?.label}</div>
                    <div className="t-small">{i.repair!.providerName} ({i.repair!.trade}) · {fmtDayDate(i.repair!.scheduledFor)} · {i.repair!.slot}</div>
                  </div>
                  <form action={advanceRepair}>
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="to" value="assigned" />
                    <button className="btn btn-accent btn-sm">Confirm the day</button>
                  </form>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* ── the people ────────────────────────────────────── */}
        <Panel>
          <PanelHead wrapMeta title={<span className="flex items-center gap-2"><UserRound size={15} /> Inspectors</span>} meta={`${o.inspectors.length} on the roster`} />
          <ul className="divide-y divide-line">
            {o.inspectors.map(({ ins, phone, held, onSite, done, open }) => (
              <li key={ins.id} className="grid gap-2.5 px-5 py-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="grow basis-[16rem]">
                    <div className="text-[14.5px] font-medium">
                      {ins.name || <span className="text-text-3">No name yet</span>} {onSite && <span className="chip chip-accent ml-1">Working now</span>}
                    </div>
                    <div className="t-small">
                      <a href={tel(phone)} className="underline underline-offset-2">{prettyPhone(phone)}</a> · {ins.city} · {done} done · holding {held}
                    </div>
                    <div className="t-small">
                      Deposit {ins.depositInr < 0 ? <b className="text-fail">{money(-ins.depositInr)} owed</b> : `${money(ins.depositInr)} of ${money(DEPOSIT.target)}`}
                      {" · "}{ins.upiId ? <span className="font-mono">{ins.upiId}</span> : <span className="text-fail">no UPI</span>}
                    </div>
                  </div>
                  <ConfirmForm action={setInspectorStatus} ask={`Change ${ins.name}'s status? Pausing hands back every job they have not started.`} className="flex gap-2">
                    <input type="hidden" name="id" value={ins.id} />
                    <select name="status" defaultValue={ins.status} className={cn(field, "w-auto")}>
                      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_COPY[s].label}</option>)}
                    </select>
                    <button className="btn btn-white btn-sm">Save</button>
                  </ConfirmForm>
                </div>
                {open.length > 0 && (
                  <ul className="grid gap-2 rounded-[10px] bg-paper px-3 py-2.5">
                    {open.map((p) => (
                      <li key={p.id}>
                        <div className="flex justify-between gap-3 text-[13px]">
                          <span>{penaltyLine(p)}</span><span className="t-small shrink-0">{fmtDate(p.at)}</span>
                        </div>
                        <ActionForm action={waivePenalty} submit="Take it back">
                          <input type="hidden" name="inspectorId" value={ins.id} />
                          <input type="hidden" name="penaltyId" value={p.id} />
                          <input name="why" required placeholder="Why — after you have spoken to them. They see this." className={cn(field, "mt-1.5")} />
                        </ActionForm>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </main>
  );
}
