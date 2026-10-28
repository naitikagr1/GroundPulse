"use server";

/* ════════════════════════════════════════════════════════════════
   Everything the ops console writes.

   The owner app and the inspector app each stop at a point where a
   person has to act: a probation report someone must read, an issue
   that needs a price from a verified pro, a repair that needs a day
   confirmed, a message that needs an answer, a refund that has to go
   out. Without this, every one of those was a dead end.
   ════════════════════════════════════════════════════════════════ */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { opsSignIn, opsSignOut, requireAdmin } from "@/lib/auth";
import { db, mutate, now, uid } from "@/lib/store";
import { pushEvent } from "@/lib/events";
import { cancelVisitIn, deliverReport } from "@/lib/lifecycle";
import { claimBlock, LIVE } from "@/lib/field";
import { sameCity } from "@/lib/city";
import { coverFor, makeQuote } from "@/lib/repair";
import { liveSub } from "@/lib/plans";
import { fmtDayDate } from "@/lib/format";
import { UPCOMING } from "@/lib/queries";
import { inr } from "@/lib/pricing";
import { DEPOSIT } from "@/lib/payout";
import type { InspectorStatus } from "@/lib/types";

export type OpsState = { ok: boolean; error?: string; message?: string };

const s = (fd: FormData, k: string, max = 400) => String(fd.get(k) ?? "").trim().slice(0, max);
const n = (fd: FormData, k: string) => Number(fd.get(k) ?? 0) || 0;

const refresh = () => {
  revalidatePath("/ops", "layout");
  revalidatePath("/app", "layout");
  revalidatePath("/field", "layout");
};

/* ── the door ────────────────────────────────────────────────── */

export async function opsLogin(_prev: OpsState, fd: FormData): Promise<OpsState> {
  const error = await opsSignIn(String(fd.get("password") ?? "").slice(0, 100));
  if (error) return { ok: false, error };
  redirect("/ops");
}

export async function opsLogout() {
  await opsSignOut();
  redirect("/ops");
}

/* ── visits ──────────────────────────────────────────────────── */

export async function assignVisit(_prev: OpsState, fd: FormData): Promise<OpsState> {
  await requireAdmin();
  const id = s(fd, "id", 60);
  const insId = s(fd, "inspectorId", 60);
  const d0 = await db();
  const v0 = d0.visits.find((x) => x.id === id);
  const ins = d0.inspectors.find((x) => x.id === insId);
  const p = v0 && d0.properties.find((x) => x.id === v0.propertyId);
  if (!v0 || !p) return { ok: false, error: "No such visit." };
  if (!["scheduled", "assigned"].includes(v0.status)) return { ok: false, error: "That visit has already started." };
  if (!ins) return { ok: false, error: "Pick an inspector." };
  if (!sameCity(p.city, ins.city)) return { ok: false, error: `${ins.name} works in ${ins.city}, not ${p.city}.` };
  const block = claimBlock(ins);
  if (block) return { ok: false, error: `${ins.name} cannot take work: ${block}` };
  const busy = d0.visits.find((x) => x.id !== id && x.inspectorId === ins.id && LIVE.includes(x.status) && x.scheduledFor === v0.scheduledFor);
  if (busy) return { ok: false, error: `${ins.name} already has ${busy.ref} that day.` };

  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id)!;
    v.inspectorId = ins.id;
    v.claimedAt = now();
    v.status = "assigned";
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.assigned",
      title: `${ins.name} is assigned`, body: `${p.label} · ${fmtDayDate(v.scheduledFor)} · ${ins.bg} · rated ${ins.rating}`,
      href: `/app/visits/${v.id}`,
    });
  });
  refresh();
  return { ok: true, message: `${ins.name} is on ${v0.ref}.` };
}

export async function unassignVisit(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id);
    if (!v || v.status !== "assigned") return;
    v.inspectorId = "";
    v.claimedAt = null;
    v.status = "scheduled";
  });
  refresh();
}

/** After five wrong codes at the door the check-in locks. Ops speaks to
    the owner first, then lets the inspector try again. */
export async function unlockCheckIn(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id);
    if (v) v.otpTries = 0;
  });
  refresh();
}

/** For a visit whose day went by with nobody there, once the owner has
    been spoken to. */
export async function cancelVisitOps(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id);
    if (!v || !["scheduled", "assigned"].includes(v.status)) return;
    cancelVisitIn(d, v, "cancelled by StillYours — nobody could make that day");
  });
  refresh();
}

/** A free launch-offer booking ops has called about. Cancelled, it stops
    counting against the 25 — even with an inspector already on it, who
    loses the job with no penalty. "Not genuine" also takes the free
    inspection off the account, so the same owner cannot book it again. */
export async function cancelFreeVisit(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id", 60);
  const fake = fd.get("fake") === "1";
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id);
    if (!v || !v.founding || !(UPCOMING as readonly string[]).includes(v.status)) return;
    cancelVisitIn(d, v, fake
      ? "cancelled by StillYours — we could not confirm this booking was genuine"
      : "cancelled by StillYours — you can book your free inspection again while places last");
    if (fake) {
      const u = d.users.find((x) => x.id === v.ownerId);
      if (u) u.freeRevokedAt = now();
    }
  });
  refresh();
}

/* ── reports held for review ─────────────────────────────────── */

export async function releaseReport(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const r = d.reports.find((x) => x.id === id);
    if (!r?.heldForReview) return;
    const v = d.visits.find((x) => x.id === r.visitId);
    if (!v) return;
    deliverReport(d, v.id, { released: true });
    /* The five probation reports are counted as they are read — not as
       they are submitted — and the fifth one read is what makes somebody
       active. */
    const ins = d.inspectors.find((x) => x.id === r.inspectorId);
    if (ins && ins.status === "probation") {
      ins.reviewedReports += 1;
      if (ins.reviewedReports >= 5) ins.status = "active";
    }
  });
  refresh();
}

/* ── quotes ──────────────────────────────────────────────────── */

export async function attachQuote(_prev: OpsState, fd: FormData): Promise<OpsState> {
  await requireAdmin();
  const id = s(fd, "id", 60);
  const provider = s(fd, "provider", 80);
  const trade = s(fd, "trade", 60);
  const labour = n(fd, "labour");
  const parts = n(fd, "parts");
  if (!provider || !trade) return { ok: false, error: "Who is doing it, and what trade?" };
  if (labour < 0 || parts < 0 || labour + parts <= 0) return { ok: false, error: "The quote needs labour or parts." };

  const d0 = await db();
  const iss0 = d0.issues.find((x) => x.id === id);
  if (!iss0 || iss0.decision !== "pending") return { ok: false, error: "That issue has already been decided." };
  const rep = d0.reports.find((x) => x.id === iss0.reportId);
  if (!rep || rep.heldForReview) return { ok: false, error: "Release the report before quoting on it." };

  const q = makeQuote(labour, parts, provider, trade);
  await mutate((d) => {
    const iss = d.issues.find((x) => x.id === id)!;
    const visit = d.visits.find((v) => v.id === iss.visitId);
    const sub = visit?.subscriptionId ? d.subscriptions.find((x) => x.id === visit.subscriptionId) ?? null : liveSub(d.subscriptions, iss.propertyId);
    iss.quote = q;
    iss.quotedAt = now();
    iss.coverEligible = fd.get("coverEligible") === "on";
    iss.coveredInr = coverFor(q, sub, iss.coverEligible);
    const p = d.properties.find((x) => x.id === iss.propertyId);
    pushEvent(d, {
      ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId, type: "issue.quoted",
      title: "A quote is ready — your decision",
      body: `${iss.title} · ${p?.label ?? ""} · ${inr(q.total)}${iss.coveredInr ? `, Care+ covers ${inr(iss.coveredInr)}` : ""}`,
      href: `/app/reports/${iss.reportId}#${iss.id}`, action: true,
    });
  });
  refresh();
  return { ok: true, message: `Quoted ${inr(q.total)}.` };
}

/* ── repairs ─────────────────────────────────────────────────── */

export async function advanceRepair(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id", 60);
  const to = s(fd, "to", 20) as "assigned" | "in_progress";
  await mutate((d) => {
    const iss = d.issues.find((x) => x.id === id);
    const r = iss?.repair;
    if (!iss || !r) return;
    if (to === "assigned" && r.status === "requested" && r.scheduledFor) {
      r.status = "assigned";
      pushEvent(d, {
        ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId, type: "repair.assigned",
        title: "Repair confirmed", body: `${iss.title} · ${r.providerName} (${r.trade}) · ${fmtDayDate(r.scheduledFor)} · ${r.slot} · an inspector will be there`,
        href: `/app/reports/${iss.reportId}#${iss.id}`,
      });
    } else if (to === "in_progress" && r.status === "assigned") {
      r.status = "in_progress";
      pushEvent(d, {
        ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId, type: "repair.started",
        title: "Repair under way", body: `${iss.title} · ${r.providerName} is working, inspector present`,
        href: `/app/reports/${iss.reportId}#${iss.id}`,
      });
    }
  });
  refresh();
}

export async function completeRepair(_prev: OpsState, fd: FormData): Promise<OpsState> {
  await requireAdmin();
  const id = s(fd, "id", 60);
  const note = s(fd, "note", 800);
  const after = s(fd, "afterPhoto", 80_000);
  if (note.length < 10) return { ok: false, error: "Say what was done — the owner reads this." };
  const ok = await mutate((d) => {
    const iss = d.issues.find((x) => x.id === id);
    const r = iss?.repair;
    if (!iss || !r || !["assigned", "in_progress"].includes(r.status)) return false;
    r.status = "completed";
    r.completedAt = now();
    r.note = note;
    r.afterPhoto = after.startsWith("data:image/") ? { id: uid(), thumb: after, at: now(), lat: null, lng: null } : null;
    pushEvent(d, {
      ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId, type: "repair.completed",
      title: "Repair completed", body: `${iss.title} · ${r.providerName} · ${r.afterPhoto ? "after-photo attached" : "see the note"}`,
      href: `/app/reports/${iss.reportId}#${iss.id}`,
    });
    return true;
  });
  if (!ok) return { ok: false, error: "Only a confirmed repair can be completed." };
  refresh();
  return { ok: true, message: "Marked done." };
}

/* ── messages ────────────────────────────────────────────────── */

export async function replyTicket(_prev: OpsState, fd: FormData): Promise<OpsState> {
  await requireAdmin();
  const id = s(fd, "id", 60);
  const reply = s(fd, "reply", 2000);
  if (reply.length < 5) return { ok: false, error: "Write the reply." };
  const ok = await mutate((d) => {
    const t = d.tickets.find((x) => x.id === id);
    if (!t || t.status === "closed") return false;
    t.reply = reply;
    t.repliedAt = now();
    t.status = "answered";
    pushEvent(d, {
      ownerId: t.ownerId, propertyId: t.propertyId, visitId: t.visitId, type: "ticket.answered",
      title: `We replied · ${t.ref}`, body: reply.length > 120 ? `${reply.slice(0, 117)}…` : reply,
      href: "/app/help#messages", action: true,
    });
    return true;
  });
  if (!ok) return { ok: false, error: "That message is closed." };
  refresh();
  return { ok: true, message: "Sent." };
}

export async function closeTicket(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const t = d.tickets.find((x) => x.id === id);
    if (t) t.status = "closed";
  });
  refresh();
}

/* ── money ───────────────────────────────────────────────────── */

/** A bill paid by UPI or bank transfer, once the money is seen in the
    account. Only ops can say so — an owner pressing "paid" is not money. */
export async function markPaid(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id", 60);
  const utr = s(fd, "utr", 40).replace(/[^\w-]/g, "");
  await mutate((d) => {
    const inv = d.invoices.find((x) => x.id === id);
    if (!inv || inv.status !== "due") return;
    inv.status = "paid";
    inv.method = [inv.method, `UPI${utr ? ` · ref ${utr}` : ""} · received ${fmtDayDate(now())}`].filter(Boolean).join(" · ");
    const v = d.visits.find((x) => x.id === inv.visitId);
    if (v && !inv.issueId) v.paid = true;
    pushEvent(d, { ownerId: inv.ownerId, propertyId: inv.propertyId, type: "invoice.paid", title: "Payment received", body: `${inv.title} · ${inr(inv.amountInr)} — thank you`, href: "/app/billing" });
  });
  refresh();
}

/** The refund itself goes out through the payment provider; this records
    that it has. */
export async function markRefunded(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const inv = d.invoices.find((x) => x.id === id);
    if (!inv || inv.status !== "refund_due") return;
    inv.status = "refunded";
    inv.method = `${inv.method} · refunded ${fmtDayDate(now())}`;
    pushEvent(d, { ownerId: inv.ownerId, propertyId: inv.propertyId, type: "invoice.refund", title: "Refund sent", body: `${inv.title} · ${inr(inv.amountInr)} back to where you paid from`, href: "/app/billing" });
  });
  refresh();
}

/* ── inspectors ──────────────────────────────────────────────── */

/** The inspector's pay has gone to their UPI. Only the jobs and refunds
    that were on the screen when ops sent it — anything submitted since
    waits for the next one. */
export async function markPayoutSent(fd: FormData) {
  await requireAdmin();
  const insId = s(fd, "inspectorId", 60);
  const ids = (key: string) => new Set(s(fd, key, 4000).split(",").filter(Boolean));
  const visitIds = ids("visitIds");
  const penaltyIds = ids("penaltyIds");
  await mutate((d) => {
    const at = now();
    for (const v of d.visits) {
      if (visitIds.has(v.id) && v.inspectorId === insId && ["submitted", "ready", "closed"].includes(v.status) && !v.payoutSentAt) v.payoutSentAt = at;
    }
    for (const p of d.inspectors.find((x) => x.id === insId)?.penalties ?? []) {
      if (penaltyIds.has(p.id) && (p.refundInr ?? 0) > 0 && !p.refundSentAt) p.refundSentAt = at;
    }
  });
  refresh();
}

const STATUSES: InspectorStatus[] = ["applied", "screened", "interviewed", "trial", "probation", "active", "paused"];

export async function setInspectorStatus(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id", 60);
  const status = s(fd, "status", 20) as InspectorStatus;
  if (!STATUSES.includes(status)) return;
  await mutate((d) => {
    const ins = d.inspectors.find((x) => x.id === id);
    if (!ins) return;
    ins.status = status;
    /* Paused mid-job: the jobs they were holding go back on the board. */
    if (status === "paused") {
      for (const v of d.visits.filter((x) => x.inspectorId === ins.id && x.status === "assigned")) {
        v.inspectorId = "";
        v.claimedAt = null;
        v.status = "scheduled";
      }
    }
  });
  refresh();
}

/** Take a deduction back — a missed visit with a real reason behind it,
    heard on a call. The money goes back on the deposit, and a waived
    miss stops counting towards a pause; lifting a pause it already
    caused is `setInspectorStatus`. What the deposit has no room for is
    theirs in cash — the message says how much to send to their UPI. */
export async function waivePenalty(_prev: OpsState, fd: FormData): Promise<OpsState> {
  await requireAdmin();
  const insId = s(fd, "inspectorId", 60);
  const penaltyId = s(fd, "penaltyId", 60);
  const why = s(fd, "why", 200);
  if (!why) return { ok: false, error: "Write down why — the inspector sees it." };

  const done = await mutate((d) => {
    const ins = d.inspectors.find((x) => x.id === insId);
    const p = ins?.penalties?.find((x) => x.id === penaltyId);
    if (!ins || !p || p.waivedAt) return null;
    const back = Math.min(p.amountInr, Math.max(0, DEPOSIT.target - ins.depositInr));
    p.waivedAt = now();
    p.waivedWhy = why;
    p.refundInr = p.amountInr - back;
    ins.depositInr += back;
    return { name: ins.name, back, refund: p.refundInr };
  });
  if (!done) return { ok: false, error: "No such deduction, or it was already taken back." };
  const { name, back, refund } = done;
  refresh();
  return {
    ok: true,
    message: refund
      ? `${inr(back)} back on ${name}'s deposit. Send ${inr(refund)} to their UPI — the deposit is already full.`
      : `${inr(back)} back on ${name}'s deposit.`,
  };
}
