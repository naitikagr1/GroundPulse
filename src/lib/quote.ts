/* ════════════════════════════════════════════════════════════════
   One price calculator, used by the booking screen to show the total
   live and by the server action that stores it. Two implementations
   would eventually disagree, and the number the owner saw has to be
   the number they are charged — the lines are saved on the visit
   exactly as they were shown.

   Every rate here comes from `pricing.ts`, `cleaning.ts` and
   `rooms.ts` — the same numbers the public pages print.
   ════════════════════════════════════════════════════════════════ */

import { plans, plotPlans, addOns, inr } from "@/lib/pricing";
import { tiers, visitPrice, type BhkKey } from "@/lib/cleaning";
import { extraRooms } from "@/lib/rooms";
import type { Line, RoomKey, VisitKind } from "@/lib/types";

export { inr };
export type { Line };

export type QuoteInput = {
  kind: VisitKind;
  planId: string;
  size: BhkKey;
  tierId: "refresh" | "deep" | "";
  addOns: Record<string, number>;
  /** the launch offer applies to this booking — see `lib/offer.ts` */
  founding?: boolean;
  /** the rooms registered, so a 4 BHK+ pays for what is past its layout */
  rooms?: Record<RoomKey, number>;
  /** booked against a plan the property is already on: the inspection is
      paid for, `left` is what remains after this one */
  plan?: { name: string; left: number; total: number } | null;
  /** a refresh clean taken from the plan's included cleans */
  planClean?: boolean;
  /** a Care+ maintenance service taken from the plan */
  planService?: boolean;
};

export type Quote = { lines: Line[]; total: number; recurring: boolean; period: string; saved: number };

const allPlans = [...plans, ...plotPlans];
const tier = (id: string) => tiers.find((t) => t.id === id);

/** A plan's price at the size of this home. 1–2 BHK pay the headline
    rate, 3 BHK the middle one, 4 BHK and up the top one. */
export function planPriceAt(planId: string, size: BhkKey) {
  const p = allPlans.find((x) => x.id === planId);
  if (!p) return 0;
  if (p.id === "one-time") return visitPrice[size];
  if (size === "3") return p.price3 ?? p.price;
  if (size === "4" || size === "5") return p.price4 ?? p.price3 ?? p.price;
  return p.price;
}

export function quote(q: QuoteInput): Quote {
  const lines: Line[] = [];
  const plan = allPlans.find((p) => p.id === q.planId);
  const buyingPlan = !q.plan && q.kind === "inspection" && (plan?.visits ?? 1) > 1;

  if (q.kind === "cleaning") {
    const t = tier(q.tierId || "refresh")!;
    const note = `${t.hours[q.size]} · crew of ${t.crew[q.size]} · inspector on site`;
    lines.push(
      q.planClean && t.id === "refresh"
        ? { k: t.name, note: "included in your plan", v: 0, was: t.price[q.size] }
        : { k: t.name, note, v: t.price[q.size] }
    );
  } else if (q.kind === "plot") {
    lines.push({ k: "Plot visit", note: "Boundary walk, GPS photos, encroachment check", v: plotPlans[0].price });
  } else {
    if (q.plan) {
      lines.push({
        k: `${q.plan.name} inspection`,
        note: `included in your plan · ${q.plan.left} of ${q.plan.total} left after this`,
        v: 0,
      });
    } else {
      const price = planPriceAt(q.planId, q.size);
      const visitsNote = plan?.visits && plan.visits > 1 ? `${plan.visits} inspections a year, booked for you` : "one verified inspector visit";
      /* The launch offer does not discount the visit, it removes the
         charge — so the old price stays on the line, struck through, and
         the owner can see exactly what they are not paying. */
      lines.push(
        q.founding
          ? { k: plan?.name ?? "Inspection", note: "free — your launch-offer inspection", v: 0, was: price }
          : { k: plan?.name ?? "Inspection", note: visitsNote, v: price }
      );

      /* Rooms past a 4 BHK+ layout, per inspection — a plan pays for all
         of its inspections up front. Plan visits are already paid for. */
      const extras = extraRooms(q.size, q.rooms, q.planId);
      if (extras.length) {
        const visits = buyingPlan ? plan?.visits ?? 1 : 1;
        const perVisit = extras.reduce((n, e) => n + e.perVisit, 0);
        lines.push({
          k: "Rooms past the layout",
          note: `${extras.map((e) => `${e.n} × ${e.one.toLowerCase()} at ${inr(e.rate)}`).join(" · ")}${visits > 1 ? ` · on each of ${visits} inspections` : ""}`,
          v: q.founding ? 0 : perVisit * visits,
          ...(q.founding ? { was: perVisit * visits } : {}),
        });
      }
    }

    /* A clean booked onto a visit an inspector is already making costs
       the rider price, not the standalone one. */
    for (const id of ["cleaning", "deep"] as const) {
      const n = q.addOns[id] ?? 0;
      if (!n) continue;
      const t = tier(id === "cleaning" ? "refresh" : "deep")!;
      if (id === "cleaning" && q.planClean) {
        lines.push({ k: t.name, note: "included in your plan · inspector on site", v: 0, was: t.rider[q.size] });
      } else {
        lines.push({ k: `${t.name}${n > 1 ? ` ×${n}` : ""}`, note: `added to a visit you are already booking · ${t.hours[q.size]}`, v: t.rider[q.size] * n });
      }
    }

    if (q.planService) {
      lines.push({ k: "Maintenance service", note: "included in Care+ · done during this visit, inspector present", v: 0 });
    }
  }

  /* Every visit is filmed on a body camera, start to finish. It is part
     of the visit, not an add-on — the site and the terms say so. */
  lines.push({ k: "Full-visit video recording", note: "body camera from the moment they walk in until they leave · included on every visit", v: 0 });

  const cars = q.addOns.car ?? 0;
  if (cars) {
    const a = addOns.find((x) => x.id === "car")!;
    lines.push({ k: `Car inspection${cars > 1 ? ` ×${cars}` : ""}`, note: a.note, v: a.price * cars });
  }

  const total = lines.reduce((n, l) => n + l.v, 0);
  const saved = lines.reduce((n, l) => n + ((l.was ?? l.v) - l.v), 0);
  return { lines, total, saved, recurring: buyingPlan, period: buyingPlan ? "for the year" : q.plan ? "on your plan" : "one visit" };
}

/** A booking is paid in full when it is made — nothing is left for the report. */
export const ADVANCE_RATE = 1;
export const advanceOf = (total: number) => (total > 0 ? Math.round(total * ADVANCE_RATE) : 0);

/* Slots an inspector can actually be given. Deliberately wide — the
   site promises a person for as long as it takes, not a 30-minute
   window nobody can keep. Always IST: the visit happens in India. */
export const SLOTS = ["07:00 – 10:00", "10:00 – 13:00", "13:00 – 16:00", "16:00 – 19:00"];

/** Add-ons a booking can carry, and how many of each. Anything else the
    browser sends is dropped on the server. */
export const ADD_ON_LIMITS: Record<string, number> = { cleaning: 1, deep: 1, car: 6 };
