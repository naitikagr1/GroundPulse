/* ════════════════════════════════════════════════════════════════
   When money is due, and what paying it does.

   · Booking: paid in full. The visit is not on anybody's board until it
     is paid — a booking nobody paid for is not a booking.
   · Report ready: whatever booking did not take — only older bookings,
     made when a quarter was paid up front. Until then the owner sees the score and
     how much was flagged; the full report opens the moment it is paid.
   · A repair: paid in full when it is approved. Approving is paying.
   · The first inspection of the launch offer is free, so none of this
     applies to it — unless something paid was added to it.

   Everything here runs inside `mutate`, on the store it is given.
   ════════════════════════════════════════════════════════════════ */

import { invoiceRef, now, uid } from "@/lib/store";
import { pushEvent } from "@/lib/events";
import { approveIssueIn } from "@/lib/lifecycle";
import { fmtDayDate } from "@/lib/format";
import { carePlusCover, inr } from "@/lib/pricing";
import { liveSub } from "@/lib/plans";
import { repairBill } from "@/lib/repair";
import type { DB, Invoice, Payment } from "@/lib/types";

export { ADVANCE_RATE, advanceOf } from "@/lib/quote";

/** The unpaid balance that keeps a report closed, if there is one. */
export const balanceDue = (d: Pick<DB, "invoices">, visitId: string): Invoice | null =>
  d.invoices.find((i) => i.visitId === visitId && i.stage === "balance" && i.status === "due") ?? null;

/** Money has arrived for this payment. Safe to call twice — the second
    time does nothing. Returns false when it had already been settled. */
export function settlePayment(d: DB, pay: Payment, razorpayPaymentId: string, method: string): boolean {
  if (pay.status === "paid") return false;
  pay.status = "paid";
  pay.paymentId = razorpayPaymentId;
  pay.paidAt = now();

  if (pay.purpose === "advance") {
    const v = d.visits.find((x) => x.id === pay.refId);
    if (!v) return true;
    const p = d.properties.find((x) => x.id === v.propertyId);
    /* Paid for a booking that was cancelled while the checkout was open:
       the money is recorded, and owed back. */
    const live = v.status === "unpaid";
    d.invoices.push({
      id: uid(), ref: invoiceRef(d), ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id,
      issueId: null, subscriptionId: v.subscriptionId,
      title: `${v.lines[0]?.k ?? "Visit"} · ${p?.label ?? ""}`,
      amountInr: pay.amountInr, status: live ? "paid" : "refund_due",
      method: live ? method : `${method} · booking was cancelled — being refunded`,
      createdAt: now(), stage: "advance", paymentId: razorpayPaymentId,
    });
    if (!live) return true;
    v.status = "scheduled";
    /* A plan bought with this booking: the rest of its year goes live too. */
    const sub = v.subscriptionId ? d.subscriptions.find((s) => s.id === v.subscriptionId) : undefined;
    if (sub?.startedByVisitId === v.id) {
      for (const o of d.visits.filter((x) => x.subscriptionId === sub.id && x.status === "unpaid")) o.status = "scheduled";
    }
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.booked",
      title: "Paid — your visit is confirmed",
      body: `${p?.label ?? ""} · ${fmtDayDate(v.scheduledFor)} · ${v.slot} · ${inr(pay.amountInr)} paid${v.amountInr > pay.amountInr ? `, ${inr(v.amountInr - pay.amountInr)} when the report is ready` : ""}`,
      href: `/app/visits/${v.id}`,
    });
    return true;
  }

  if (pay.purpose === "invoice") {
    const inv = d.invoices.find((i) => i.id === pay.refId);
    if (!inv) return true;
    if (inv.status === "due") {
      inv.status = "paid";
      inv.method = [method, inv.method].filter(Boolean).join(" · ");
      inv.paymentId = razorpayPaymentId;
      pushEvent(d, {
        ownerId: inv.ownerId, propertyId: inv.propertyId, visitId: inv.visitId ?? undefined, type: "invoice.paid",
        title: inv.stage === "balance" ? "Paid — your full report is open" : "Bill paid",
        body: `${inv.title} · ${inr(inv.amountInr)} · ${inv.ref}`,
        href: inv.stage === "balance" && inv.visitId
          ? `/app/reports/${d.visits.find((v) => v.id === inv.visitId)?.reportId ?? ""}`
          : "/app/billing",
      });
    }
    return true;
  }

  /* a repair: approving it is paying for it */
  const iss = d.issues.find((i) => i.id === pay.refId);
  if (!iss) return true;
  if (iss.decision !== "pending") {
    /* Decided some other way while the checkout was open — owed back. */
    d.invoices.push({
      id: uid(), ref: invoiceRef(d), ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId,
      issueId: iss.id, subscriptionId: null, title: `${iss.title} · ${iss.ref}`,
      amountInr: pay.amountInr, status: "refund_due", method: `${method} · already decided — being refunded`,
      createdAt: now(), stage: "repair", paymentId: razorpayPaymentId,
    });
    return true;
  }
  /* The cover the owner was shown, but never more than is left of the
     year now — two repairs approved at once cannot both spend the same
     rupees. Anything the cover can no longer take becomes a bill. */
  const visit = d.visits.find((v) => v.id === iss.visitId);
  const sub = visit?.subscriptionId ? d.subscriptions.find((x) => x.id === visit.subscriptionId) ?? null : liveSub(d.subscriptions, iss.propertyId);
  const left = sub ? Math.max(0, carePlusCover.yearly - sub.coverUsedInr) : 0;
  const covered = Math.min(pay.coveredInr, left);
  const bill = repairBill({ ...iss, decision: "approved", coveredInr: covered }, { founding: visit?.founding === true, sub });
  approveIssueIn(d, iss, {
    covered,
    payable: pay.amountInr,
    feeWaived: bill?.feeWaived ?? 0,
    feeCovered: bill?.feeCovered ?? 0,
    paymentId: razorpayPaymentId,
    method,
  });
  const shortfall = pay.coveredInr - covered;
  if (shortfall > 0) {
    d.invoices.push({
      id: uid(), ref: invoiceRef(d), ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId,
      issueId: null, subscriptionId: sub?.id ?? null,
      title: `${iss.title} · ${iss.ref} · the part Care+ could no longer cover`,
      amountInr: shortfall, status: "due", method: "Another repair used the rest of this year's cover first", createdAt: now(), stage: "repair",
    });
  }
  return true;
}
