/* ════════════════════════════════════════════════════════════════
   The moments a visit changes hands — shared by every side.

   A report reaching the owner, a visit being cancelled, a visit being
   finished with: each of these touches the visit, the plan, the bills
   and the timeline together, and each is reached from more than one
   place (the inspector submitting, ops releasing a held report, the
   owner cancelling, an account being closed). One implementation of
   each, so they can never drift apart.

   Everything here runs inside `mutate` — plain functions over the
   store, no reads of their own.
   ════════════════════════════════════════════════════════════════ */

import { invoiceRef, now, uid } from "@/lib/store";
import { pushEvent } from "@/lib/events";
import { addDays, todayKey } from "@/lib/format";
import { inr } from "@/lib/pricing";
import { liveSub, planName } from "@/lib/plans";
import type { DB, Issue, Visit } from "@/lib/types";

const kindLabel = (v: Visit) => (v.kind === "cleaning" ? "Cleaning" : v.kind === "plot" ? "Plot visit" : "Inspection");

/** A report reaches the owner. The visit has happened, so this is when the
    anything booking did not take is billed (only older bookings, made
    when a quarter was paid up front) — and when a plan bought with it
    actually starts its year. */
export function deliverReport(d: DB, visitId: string, opts: { released?: boolean } = {}) {
  const v = d.visits.find((x) => x.id === visitId);
  if (!v?.reportId) return;
  const r = d.reports.find((x) => x.id === v.reportId);
  const p = d.properties.find((x) => x.id === v.propertyId);
  if (!r || !p) return;

  r.heldForReview = false;
  if (opts.released) {
    r.reviewedAt = now();
    r.publishedAt = now();
  }
  v.status = "ready";

  const sub = v.subscriptionId ? d.subscriptions.find((s) => s.id === v.subscriptionId) : undefined;
  const startsPlan = !!sub && sub.status === "pending" && sub.startedByVisitId === v.id;
  if (sub && startsPlan) {
    sub.status = "active";
    sub.startedAt = now();
    sub.renewsAt = addDays(todayKey(), 365);
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "plan.started",
      title: `${planName(sub.planId)} has started`,
      body: `${p.label} · the year runs from today · renews ${sub.renewsAt}`,
      href: "/app/plan",
    });
  }

  /* Whatever booking did not take is due now — only older bookings, made
     when a quarter was paid up front, have any. Until it is paid the owner sees the score and how much was flagged,
     and the full report opens the moment it is. */
  const advancePaid = d.invoices.filter((i) => i.visitId === v.id && i.stage === "advance" && i.status === "paid").reduce((n, i) => n + i.amountInr, 0);
  const balance = Math.max(0, v.amountInr - advancePaid);
  if (balance > 0 && !d.invoices.some((i) => i.visitId === v.id && !i.issueId && i.stage !== "advance")) {
    d.invoices.push({
      id: uid(), ref: invoiceRef(d), ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id,
      issueId: null, subscriptionId: startsPlan ? sub!.id : null,
      title: `${advancePaid ? "Balance · " : ""}${v.lines[0]?.k ?? kindLabel(v)} · ${p.label}`,
      amountInr: balance, status: "due", method: "", createdAt: now(), stage: "balance",
    });
  }

  const flagged = d.issues.filter((i) => i.reportId === r.id).length;
  pushEvent(d, {
    ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "report.ready",
    title: balance ? `Your report is ready — pay ${inr(balance)} to open it` : "Your report is ready",
    body: `${p.label} · health ${r.score} · ${flagged ? `${flagged} ${flagged === 1 ? "thing" : "things"} flagged` : "nothing needs fixing"}`,
    href: `/app/reports/${r.id}`, action: flagged > 0 || balance > 0,
  });
}

/** Once the owner has read the report and decided everything in it, the
    visit is finished with. */
export function closeIfSettled(d: DB, visitId: string) {
  const v = d.visits.find((x) => x.id === visitId);
  if (!v || v.status !== "ready" || !v.reportId) return;
  const r = d.reports.find((x) => x.id === v.reportId);
  if (!r?.readAt) return;
  if (d.issues.some((i) => i.reportId === r.id && i.decision === "pending")) return;
  v.status = "closed";
}

/** Give a cancelled visit's places back to its plan. */
function releasePlanPlaces(d: DB, v: Visit) {
  const sub = v.subscriptionId ? d.subscriptions.find((s) => s.id === v.subscriptionId) : undefined;
  if (!sub) return;
  if (v.usesPlan) sub.visitsUsed = Math.max(0, sub.visitsUsed - 1);
  if (v.planClean) sub.cleansUsed = Math.max(0, sub.cleansUsed - 1);
  if (v.planService) sub.servicesUsed = Math.max(0, sub.servicesUsed - 1);
}

/** Cancel one visit and put right everything hanging off it: the plan's
    places, the bill, the free inspection, and — when this was the booking
    that bought a plan that never started — the plan and the rest of its
    rhythm with it. Returns what happened to money, for the timeline. */
export function cancelVisitIn(d: DB, v: Visit, why: string): { refund: number; planCancelled: boolean } {
  const p = d.properties.find((x) => x.id === v.propertyId);
  v.status = "cancelled";
  v.cancelledAt = now();
  releasePlanPlaces(d, v);

  let refund = 0;
  for (const inv of d.invoices.filter((i) => i.visitId === v.id && !i.issueId)) {
    if (inv.status === "due") d.invoices = d.invoices.filter((i) => i.id !== inv.id);
    else if (inv.status === "paid") {
      inv.status = "refund_due";
      inv.method = `${inv.method ? `${inv.method} · ` : ""}visit cancelled — being refunded`;
      refund += inv.amountInr;
    }
  }

  /* Cancelling gives the free inspection back — it was never used. */
  if (v.founding) {
    const u = d.users.find((x) => x.id === v.ownerId);
    if (u) u.freeVisitUsedAt = null;
  }

  let planCancelled = false;
  const sub = v.subscriptionId ? d.subscriptions.find((s) => s.id === v.subscriptionId) : undefined;
  if (sub && sub.status === "pending" && sub.startedByVisitId === v.id) {
    sub.status = "cancelled";
    planCancelled = true;
    for (const other of d.visits.filter((x) => x.subscriptionId === sub.id && x.id !== v.id && ["unpaid", "scheduled", "assigned"].includes(x.status))) {
      other.status = "cancelled";
      other.cancelledAt = now();
      releasePlanPlaces(d, other);
    }
  }

  pushEvent(d, {
    ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.cancelled",
    title: "Visit cancelled",
    body: [
      `${p?.label ?? "Property"} · ${v.ref}`,
      why,
      refund ? `${inr(refund)} already paid is being refunded` : "",
      planCancelled && sub ? `${planName(sub.planId)} cancelled with it — it had not started` : "",
    ].filter(Boolean).join(" · "),
    href: `/app/visits/${v.id}`,
  });

  return { refund, planCancelled };
}

/** The owner says yes to a repair — with the money already in when there
    was any to pay. The one place an approval is written, whether it came
    from a fully-covered tap or from a payment settling. */
export function approveIssueIn(
  d: DB, iss: Issue,
  money: { covered: number; payable: number; feeWaived: number; feeCovered?: number; paymentId?: string; method?: string },
) {
  const visit = d.visits.find((v) => v.id === iss.visitId);
  const sub = visit?.subscriptionId ? d.subscriptions.find((x) => x.id === visit.subscriptionId) ?? null : liveSub(d.subscriptions, iss.propertyId);
  iss.decision = "approved";
  iss.decidedAt = now();
  iss.coveredInr = money.covered;
  if (sub && money.covered) sub.coverUsedInr += money.covered;
  /* Approved live, with the inspector still inside: it is done now, on
     this visit. Anything else waits for the owner to pick a day. */
  const now_ = !!iss.sentAt && visit?.status === "on_site";
  iss.repair = {
    status: now_ ? "in_progress" : "requested", providerName: iss.quote?.provider ?? "", trade: iss.quote?.trade ?? "",
    scheduledFor: now_ ? visit!.scheduledFor : "", slot: now_ ? visit!.slot : "",
    completedAt: null, note: "", afterPhoto: null, afterVideo: null,
  };
  if (money.payable > 0) {
    d.invoices.push({
      id: uid(), ref: invoiceRef(d), ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId,
      issueId: iss.id, subscriptionId: money.covered && sub ? sub.id : null,
      title: `${iss.title} · ${iss.ref}`,
      amountInr: money.payable,
      status: "paid",
      method: [
        money.method ?? "",
        money.feeWaived ? `Launch offer · ${inr(money.feeWaived)} StillYours fee waived` : "",
        money.covered ? `Care+ covers ${inr(money.covered)}${money.feeCovered ? ", no StillYours fee" : ""}` : "",
      ].filter(Boolean).join(" · "),
      createdAt: now(), stage: "repair", paymentId: money.paymentId ?? "",
    });
  }
  pushEvent(d, {
    ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId,
    type: "issue.approved",
    title: "You approved a repair",
    body: `${iss.title} · ${iss.ref}${money.payable ? ` · ${inr(money.payable)} paid` : " · fully covered"}${money.covered ? `, Care+ covers ${inr(money.covered)}` : ""} — ${now_ ? "being done now, with your inspector there" : "pick a day for it"}`,
    href: iss.reportId ? `/app/reports/${iss.reportId}#${iss.id}` : `/app/visits/${iss.visitId}#live`,
  });
  closeIfSettled(d, iss.visitId);
}
