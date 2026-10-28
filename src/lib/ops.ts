/* ════════════════════════════════════════════════════════════════
   What the ops page reads — every place the two apps stop and wait
   for a person, in one pass over the store.

   Each list is only what needs doing now. An empty list is a section
   the page does not show.
   ════════════════════════════════════════════════════════════════ */

import { db } from "@/lib/store";
import { addDays, todayKey } from "@/lib/format";
import { CAN_WORK, LIVE } from "@/lib/field";
import { HELD } from "@/lib/jobs";
import { sameCity } from "@/lib/city";
import { freeBooked } from "@/lib/offer";
import { UPCOMING } from "@/lib/queries";
import type { Inspector, Visit } from "@/lib/types";

const DONE: Visit["status"][] = ["submitted", "ready", "closed"];
/** Unassigned visits this close are ops' to fill if nobody claims them. */
const SOON_DAYS = 2;

/** What reaches the inspector's UPI for one job — less what went to the deposit. */
export const netPay = (v: Visit) => v.payoutInr + (v.overtimeInr ?? 0) - (v.depositHeldInr ?? 0);

export async function opsView() {
  const d = await db();
  const today = todayKey();
  const prop = (id: string) => d.properties.find((p) => p.id === id);
  const person = (id: string) => d.users.find((u) => u.id === id);
  const inspector = (id: string) => d.inspectors.find((i) => i.id === id);
  const phoneOf = (id: string) => {
    const u = person(id);
    return u ? u.contactPhone || u.phone : "";
  };

  /* pay: finished jobs not yet sent, and waiver refunds not yet sent */
  const pay = d.inspectors
    .map((ins) => {
      const jobs = d.visits
        .filter((v) => v.inspectorId === ins.id && DONE.includes(v.status) && !v.payoutSentAt)
        .sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1));
      const refunds = (ins.penalties ?? []).filter((p) => (p.refundInr ?? 0) > 0 && !p.refundSentAt);
      const total = jobs.reduce((n, v) => n + netPay(v), 0) + refunds.reduce((n, p) => n + (p.refundInr ?? 0), 0);
      return { ins, jobs, refunds, total };
    })
    .filter((x) => x.jobs.length || x.refunds.length);

  /* five wrong codes at the door */
  const locked = d.visits
    .filter((v) => ["assigned", "en_route"].includes(v.status) && (v.otpTries ?? 0) >= 5)
    .map((v) => ({ v, property: prop(v.propertyId), inspector: inspector(v.inspectorId), ownerPhone: phoneOf(v.ownerId) }));

  /* probation reports waiting for a person to read them */
  const review = d.reports
    .filter((r) => r.heldForReview)
    .map((r) => ({
      r,
      property: prop(r.propertyId),
      inspector: inspector(r.inspectorId),
      flagged: r.rooms.flatMap((room) => room.items.filter((i) => i.s !== "pass").map((i) => ({ room: room.name, ...i }))),
    }));

  /* on the board with nobody on it, today or the next two days — or missed */
  const horizon = addDays(today, SOON_DAYS);
  const unassigned = d.visits
    .filter((v) => v.status === "scheduled" && !v.inspectorId && (v.scheduledFor <= horizon || !!v.missedAt))
    .sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1))
    .map((v) => {
      const property = prop(v.propertyId);
      return {
        v, property, ownerPhone: phoneOf(v.ownerId), gone: v.scheduledFor < today,
        who: d.inspectors.filter((i) => CAN_WORK.includes(i.status) && !!property && sameCity(property.city, i.city)),
      };
    });

  const tickets = d.tickets
    .filter((t) => t.status === "open")
    .map((t) => ({ t, owner: person(t.ownerId), property: t.propertyId ? prop(t.propertyId) : undefined }));

  const money = d.invoices
    .filter((i) => i.status === "due" || i.status === "refund_due")
    .map((i) => ({ i, owner: person(i.ownerId), property: prop(i.propertyId) }));

  /* flagged items with no price, on reports the owner can already see */
  const quotes = d.issues
    .filter((i) => i.decision === "pending" && !i.quote && !d.reports.find((r) => r.id === i.reportId)?.heldForReview)
    .map((i) => ({ i, property: prop(i.propertyId) }));

  /* approved repairs whose day the owner has picked, waiting to be confirmed */
  const repairs = d.issues
    .filter((i) => i.repair?.status === "requested" && !!i.repair.scheduledFor)
    .map((i) => ({ i, property: prop(i.propertyId) }));

  /* free launch-offer bookings still to happen — the ones ops can call
     about and cancel if they are not genuine. A cancelled one stops
     counting against the 25. */
  const free = {
    booked: freeBooked(d.visits),
    open: d.visits
      .filter((v) => v.founding && (UPCOMING as readonly string[]).includes(v.status))
      .sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1))
      .map((v) => {
        const ins = v.inspectorId ? inspector(v.inspectorId) : undefined;
        return {
          v, property: prop(v.propertyId), owner: person(v.ownerId), ownerPhone: phoneOf(v.ownerId),
          inspector: ins, inspectorPhone: ins ? (ins.userId ? person(ins.userId)?.phone : "") || ins.phone : "",
        };
      }),
  };

  const inspectors = d.inspectors.map((ins: Inspector) => ({
    ins,
    phone: (ins.userId ? person(ins.userId)?.phone : "") || ins.phone,
    held: d.visits.filter((v) => v.inspectorId === ins.id && HELD.includes(v.status)).length,
    onSite: d.visits.some((v) => v.inspectorId === ins.id && LIVE.includes(v.status) && v.status !== "assigned"),
    done: d.visits.filter((v) => v.inspectorId === ins.id && DONE.includes(v.status)).length,
    open: (ins.penalties ?? []).filter((p) => !p.waivedAt).reverse(),
  }));

  return { pay, locked, review, unassigned, free, tickets, money, quotes, repairs, inspectors };
}
