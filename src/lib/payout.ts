/* ════════════════════════════════════════════════════════════════
   What an inspector earns for a job.

   A fixed amount by the size of the home — not a cut of what this
   owner paid. A Care visit or a launch-offer visit costs the owner
   nothing on the day, and the person walking it is owed the same
   either way. Shown on the job board before anyone claims anything.
   ════════════════════════════════════════════════════════════════ */

import type { Property, VisitKind } from "@/lib/types";
import type { BhkKey } from "@/lib/cleaning";

/** What a visit pays, by size. 1 and 2 BHK are priced as one, as the
    plans are. */
export const PAY: Record<BhkKey, number> = { "1": 800, "2": 800, "3": 1000, "4": 1250, "5": 1500 };
/** Plots are one amount for now — half of the ₹1,999 plot visit. They
    get sizes of their own later. */
export const PLOT_PAY = 1000;

/** On top, whatever the size. Staying with a cleaning crew is not paid
    separately — the hours past the included ones are overtime. */
export const RATES = { perCar: 300 } as const;

/** The size as an inspector reads it: "1–2 BHK", "3 BHK", "5 BHK". */
export const payLabel = (size: BhkKey) => (size === "1" || size === "2" ? "1–2 BHK" : `${size} BHK`);

export type PayLine = { k: string; v: number };

/** Every line of what a job pays, in the order the job card shows them. */
export function payLines(p: Property, kind: VisitKind, addOns: Record<string, number> = {}): PayLine[] {
  const lines: PayLine[] = [kind === "plot" ? { k: "Plot visit", v: PLOT_PAY } : { k: `${payLabel(p.size)} visit`, v: PAY[p.size] }];
  if (addOns.car) lines.push({ k: `Car check × ${addOns.car}`, v: RATES.perCar * addOns.car });
  return lines;
}

export const payoutFor = (p: Property, kind: VisitKind, addOns: Record<string, number> = {}) =>
  payLines(p, kind, addOns).reduce((n, l) => n + l.v, 0);

/* Time on site past the included hours is paid by the hour — by us,
   never added to the owner's bill. Two hours up to a 3 BHK, two and a
   half for a 4 BHK and up. Every hour begun counts: two hours and ten
   minutes on a 2 BHK is one extra hour. Measured from check-in to submit. */
export const OVERTIME = {
  perHour: 200,
  included: { "1": 120, "2": 120, "3": 120, "4": 150, "5": 150 } as Record<BhkKey, number>,
  plot: 120,
} as const;

/** Minutes on site before overtime starts, for this job. */
export const includedMinutes = (p: Pick<Property, "size">, kind: VisitKind) => (kind === "plot" ? OVERTIME.plot : OVERTIME.included[p.size]);

/** "2 hours" / "2½ hours" */
export const hoursWords = (minutes: number) => `${Math.floor(minutes / 60)}${minutes % 60 ? "½" : ""} hours`;

export function overtimeFor(startedAt: string | null, endedAt: string | null, freeMinutes: number) {
  if (!startedAt || !endedAt) return 0;
  const minutes = (Date.parse(endedAt) - Date.parse(startedAt)) / 60_000;
  const extra = minutes - freeMinutes;
  return extra > 0 ? Math.ceil(extra / 60) * OVERTIME.perHour : 0;
}

/* The deposit is held back from pay, never asked for in cash: half of
   what each job pays — never its overtime — until ₹5,000 is in. The
   first ₹1,500 of it unlocks holding five jobs instead of two (see
   HOLD in lib/jobs). A deduction
   that takes it below ₹5,000 is made good the same way, so a deposit
   below zero is just half of the next jobs' pay. */
export const DEPOSIT = { target: 5000, unlock: 1500, rate: 0.5 } as const;

/** How many jobs an inspector may hold, and what a broken promise costs —
    enforced in lib/jobs. */
export const HOLD = { max: 5, untilUnlock: 2, perDay: 3 } as const;
export const PENALTY = { noShow: 250, lateRelease: 150, freeReleaseHours: 24, enRouteGraceMinutes: 45, pauseAfter: 2, pauseWindowDays: 30 } as const;

/** A four-digit code the owner reads out at the door. Deliberately not
    six: it is spoken over a bad line, not typed from an SMS. */
export const newOtp = () => String(Math.floor(1000 + Math.random() * 9000));
