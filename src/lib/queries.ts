/* ════════════════════════════════════════════════════════════════
   Every read the owner app makes, scoped by owner in one place so no
   page can accidentally render somebody else's property.

   A report held for review does not exist to the owner yet — and
   neither does anything flagged in it. Filtering the report but not
   its issues is what used to put "2 things need your decision" on the
   dashboard with a Decide button that led to a 404.
   ════════════════════════════════════════════════════════════════ */

import { db } from "@/lib/store";
import { liveSub } from "@/lib/plans";
import { todayKey } from "@/lib/format";
import type { DB, Invoice, Issue, Property, Report, Subscription, Ticket, Visit } from "@/lib/types";
import { balanceDue } from "@/lib/payments";
import { spotsLeft } from "@/lib/offer";

const byDateDesc = (a: string, b: string) => (a < b ? 1 : -1);

/** Report ids the owner is allowed to see. */
const visibleReports = (d: DB) => new Set(d.reports.filter((r) => !r.heldForReview).map((r) => r.id));

/** A visit the owner is still waiting on: booked, not done, not cancelled. */
export const UPCOMING = ["unpaid", "scheduled", "assigned"] as const;
export const LIVE_STATUSES = ["en_route", "on_site", "submitted"] as const;

/** Booked for a day that has already gone, and nobody came. */
export const isOverdue = (v: Pick<Visit, "status" | "scheduledFor">) =>
  (UPCOMING as readonly string[]).includes(v.status) && v.scheduledFor < todayKey();

/** A property with everything the cards and the detail page need. */
export type PropertyView = {
  property: Property;
  score: number | null;
  lastReport: Report | null;
  nextVisit: Visit | null;
  liveVisit: Visit | null;
  openIssues: Issue[];
  visits: Visit[];
  reports: Report[];
  /** the plan it is on now, if any — a cancelled or ended one is not "on" */
  subscription: Subscription | null;
};

export async function properties(ownerId: string) {
  const d = await db();
  return d.properties.filter((p) => p.ownerId === ownerId && !p.archivedAt);
}

export async function propertyViews(ownerId: string): Promise<PropertyView[]> {
  const d = await db();
  const seen = visibleReports(d);
  const mine = d.properties.filter((p) => p.ownerId === ownerId && !p.archivedAt);
  const subs = d.subscriptions.filter((s) => s.ownerId === ownerId);
  return mine.map((property) => {
    const visits = d.visits.filter((v) => v.propertyId === property.id).sort((a, b) => byDateDesc(a.scheduledFor, b.scheduledFor));
    const reports = d.reports.filter((r) => r.propertyId === property.id && seen.has(r.id)).sort((a, b) => byDateDesc(a.publishedAt, b.publishedAt));
    const openIssues = d.issues.filter((i) => i.propertyId === property.id && i.decision === "pending" && seen.has(i.reportId));
    const lastReport = reports[0] ?? null;
    return {
      property,
      score: lastReport?.score ?? null,
      lastReport,
      nextVisit: visits.filter((v) => (UPCOMING as readonly string[]).includes(v.status)).sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1))[0] ?? null,
      liveVisit: visits.find((v) => (LIVE_STATUSES as readonly string[]).includes(v.status)) ?? null,
      openIssues,
      visits,
      reports,
      subscription: liveSub(subs, property.id),
    };
  });
}

export async function propertyView(ownerId: string, id: string) {
  const all = await propertyViews(ownerId);
  return all.find((v) => v.property.id === id) ?? null;
}

export async function visitView(ownerId: string, id: string) {
  const d = await db();
  const visit = d.visits.find((v) => v.id === id && v.ownerId === ownerId);
  if (!visit) return null;
  const report = visit.reportId ? d.reports.find((r) => r.id === visit.reportId) ?? null : null;
  return {
    visit,
    property: d.properties.find((p) => p.id === visit.propertyId)!,
    inspector: d.inspectors.find((i) => i.id === visit.inspectorId) ?? null,
    /** null while it is being reviewed — the owner cannot open it yet */
    report: report && !report.heldForReview ? report : null,
    heldForReview: !!report?.heldForReview,
    invoice: d.invoices.find((i) => i.visitId === visit.id && !i.issueId && i.stage !== "advance") ?? null,
    advance: d.invoices.find((i) => i.visitId === visit.id && i.stage === "advance") ?? null,
    balance: balanceDue(d, visit.id),
    /** what the inspector sent live from the property, newest first */
    live: d.issues.filter((i) => i.visitId === visit.id && i.sentAt).sort((a, b) => (a.sentAt! < b.sentAt! ? 1 : -1)),
    liveInvoices: Object.fromEntries(d.invoices.filter((i) => i.issueId && i.visitId === visit.id).map((i) => [i.issueId!, i])) as Record<string, Invoice>,
    coverSub: visit.subscriptionId ? d.subscriptions.find((s) => s.id === visit.subscriptionId) ?? null : liveSub(d.subscriptions, visit.propertyId),
    subscription: visit.subscriptionId ? d.subscriptions.find((s) => s.id === visit.subscriptionId) ?? null : null,
    tickets: d.tickets.filter((t) => t.visitId === visit.id && t.ownerId === ownerId).sort((a, b) => byDateDesc(a.createdAt, b.createdAt)),
  };
}

export async function reportView(ownerId: string, id: string) {
  const d = await db();
  const report = d.reports.find((r) => r.id === id && r.ownerId === ownerId && !r.heldForReview);
  if (!report) return null;
  return reportContext(d, report);
}

/** A report by its share token — for the read-only link family members get. */
export async function sharedReport(token: string) {
  if (!token || token.length < 20) return null;
  const d = await db();
  const report = d.reports.find((r) => r.shareToken === token && !r.heldForReview);
  if (!report) return null;
  return reportContext(d, report);
}

function reportContext(d: DB, report: Report) {
  const visit = d.visits.find((v) => v.id === report.visitId)!;
  const issues = d.issues.filter((i) => i.reportId === report.id);
  return {
    report,
    /** anything still owed on the visit — while it is, only the headline shows */
    balance: balanceDue(d, visit.id),
    property: d.properties.find((p) => p.id === report.propertyId)!,
    visit,
    inspector: d.inspectors.find((i) => i.id === report.inspectorId) ?? null,
    issues,
    subscription: visit.subscriptionId
      ? d.subscriptions.find((s) => s.id === visit.subscriptionId) ?? null
      : liveSub(d.subscriptions, report.propertyId),
    /** the bill raised for each approved repair, by issue */
    invoicesByIssue: Object.fromEntries(d.invoices.filter((i) => i.issueId && issues.some((x) => x.id === i.issueId)).map((i) => [i.issueId!, i])) as Record<string, Invoice>,
    tickets: d.tickets.filter((t) => t.reportId === report.id).sort((a, b) => byDateDesc(a.createdAt, b.createdAt)),
  };
}

/** Everything flagged that is still waiting on the owner — only from
    reports they can actually open. */
export async function openIssues(ownerId: string) {
  const d = await db();
  const seen = visibleReports(d);
  /* a live one, sent from the property, is open before any report exists */
  return d.issues.filter((i) => i.ownerId === ownerId && i.decision === "pending" && (seen.has(i.reportId) || !!i.sentAt));
}

/** Where to decide on an issue: the visit while it is live, else its report. */
export const issueHref = (i: Pick<Issue, "id" | "reportId" | "visitId">) =>
  i.reportId ? `/app/reports/${i.reportId}#${i.id}` : `/app/visits/${i.visitId}#live`;

/** Repairs the owner approved but has not said when yet. */
export async function repairsToSchedule(ownerId: string) {
  const d = await db();
  return d.issues.filter((i) => i.ownerId === ownerId && i.decision === "approved" && i.repair?.status === "requested" && !i.repair.scheduledFor);
}

export async function timeline(ownerId: string, propertyId?: string) {
  const d = await db();
  return d.events
    .filter((e) => e.ownerId === ownerId && (!propertyId || e.propertyId === propertyId))
    .sort((a, b) => byDateDesc(a.at, b.at));
}

export async function unread(ownerId: string) {
  const d = await db();
  return d.events.filter((e) => e.ownerId === ownerId && !e.readAt).sort((a, b) => byDateDesc(a.at, b.at));
}

export async function visits(ownerId: string) {
  const d = await db();
  return d.visits.filter((v) => v.ownerId === ownerId).sort((a, b) => byDateDesc(a.scheduledFor, b.scheduledFor));
}

/** Which of these visits have a report the owner can open. */
export async function openableReports(ownerId: string) {
  const d = await db();
  return new Set(d.reports.filter((r) => r.ownerId === ownerId && !r.heldForReview).map((r) => r.id));
}

export async function invoices(ownerId: string) {
  const d = await db();
  return d.invoices.filter((i) => i.ownerId === ownerId).sort((a, b) => byDateDesc(a.createdAt, b.createdAt));
}

/** Bookings waiting to be paid — not on anybody's board until they are. */
export async function awaitingAdvance(ownerId: string) {
  const d = await db();
  return d.visits
    .filter((v) => v.ownerId === ownerId && v.status === "unpaid" && v.advanceInr > 0)
    .sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1));
}

/** Every plan the owner has had, newest first — live ones and ended ones. */
export async function subscriptions(ownerId: string) {
  const d = await db();
  return d.subscriptions.filter((s) => s.ownerId === ownerId).sort((a, b) => byDateDesc(a.startedAt, b.startedAt));
}

export async function tickets(ownerId: string): Promise<Ticket[]> {
  const d = await db();
  return d.tickets.filter((t) => t.ownerId === ownerId).sort((a, b) => byDateDesc(a.createdAt, b.createdAt));
}

/** How many free launch-offer inspections are left to book. The places
    are shared by every owner, so this is the one read that is not scoped
    to one — and only the count leaves here. */
export async function freeSpotsLeft() {
  return spotsLeft((await db()).visits);
}

export async function inspectorsById() {
  const d = await db();
  return Object.fromEntries(d.inspectors.map((i) => [i.id, i]));
}

/** The one number the dashboard leads with. */
export function portfolioScore(views: PropertyView[]) {
  const scored = views.filter((v) => v.score !== null);
  if (!scored.length) return null;
  return Math.round(scored.reduce((n, v) => n + (v.score ?? 0), 0) / scored.length);
}
