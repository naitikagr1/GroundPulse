/* ════════════════════════════════════════════════════════════════
   Yearly plans, as the owner lives them.

   A plan is four inspections a year, two refresh cleans, and on Care+
   two maintenance services and the repair cover. Before this file the
   app could sell a plan but never use one: booking the next visit sold
   the whole plan again and reset the year. Now every booking against a
   plan takes one of its inspections, and nothing is bought twice.
   ════════════════════════════════════════════════════════════════ */

import { plans } from "@/lib/pricing";
import { addDays, daysBetween, fmtDate, todayKey } from "@/lib/format";
import type { Subscription, SubStatus } from "@/lib/types";

export const PLAN_IDS = ["care", "care-plus"] as const;
export const isPlanId = (id: string) => (PLAN_IDS as readonly string[]).includes(id);

/** What one plan year includes — the same list the pricing page prints. */
export function planAllowance(planId: string) {
  const p = plans.find((x) => x.id === planId);
  return { visits: p?.visits ?? 4, cleans: 2, services: planId === "care-plus" ? 2 : 0 };
}

export const planName = (planId: string) => plans.find((p) => p.id === planId)?.name ?? planId;

/** The stored status, corrected by the calendar: a year that has run out
    has ended whatever the row says. */
export function effectiveStatus(s: Subscription): SubStatus {
  if (s.status === "active" && s.renewsAt && s.renewsAt < todayKey()) return "lapsed";
  return s.status;
}

/** Can this plan still take bookings? */
export const isLive = (s: Subscription) => ["pending", "active"].includes(effectiveStatus(s));

/** The plan a property is on right now, if any. */
export function liveSub<T extends Subscription>(subs: T[], propertyId: string): T | null {
  return subs.find((s) => s.propertyId === propertyId && isLive(s)) ?? null;
}

/** What is left to book this plan year. */
export function allowanceLeft(s: Subscription) {
  return {
    visits: Math.max(0, s.visitsTotal - s.visitsUsed),
    cleans: Math.max(0, s.cleansTotal - s.cleansUsed),
    services: Math.max(0, s.servicesTotal - s.servicesUsed),
  };
}

/** One honest line about where the plan stands. */
export function planStatus(s: Subscription): { label: string; tone: "accent" | "warn" | "fail" | ""; note: string } {
  const st = effectiveStatus(s);
  if (st === "pending") return { label: "Starts with its first visit", tone: "warn", note: "Paid when booked. The year starts when the first report is ready." };
  if (st === "cancelled") return { label: "Cancelled", tone: "fail", note: "Nothing more is booked or billed on it." };
  if (st === "lapsed") return { label: `Ended ${s.renewsAt ? fmtDate(s.renewsAt, { year: true }) : ""}`.trim(), tone: "fail", note: "Book a plan again from the booking screen to start another year." };
  return s.autoRenew
    ? { label: "Active", tone: "accent", note: `Renews ${s.renewsAt ? fmtDate(s.renewsAt, { year: true }) : ""}.` }
    : { label: "Active · not renewing", tone: "warn", note: `Ends ${s.renewsAt ? fmtDate(s.renewsAt, { year: true }) : ""}. Everything left on it stays yours until then.` };
}

/** "A yearly plan books the rhythm for you" — quarterly from the first
    visit. The owner can move or cancel any of them. */
export const rhythm = (first: string, count: number) => Array.from({ length: count }, (_, i) => addDays(first, 91 * (i + 1)));

/** What moving from Care to Care+ costs for the rest of this plan year.
    A plan that has not started yet costs nothing to change — it is billed
    in full, at the new price, with its first visit. */
export function upgradePrice(fromInr: number, toInr: number, s: Subscription) {
  if (effectiveStatus(s) !== "active" || !s.renewsAt) return 0;
  const daysLeft = Math.min(365, Math.max(0, daysBetween(todayKey(), s.renewsAt)));
  return Math.max(0, Math.round((((toInr - fromInr) * daysLeft) / 365) / 50) * 50);
}
