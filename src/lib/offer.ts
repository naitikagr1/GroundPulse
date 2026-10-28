/* ════════════════════════════════════════════════════════════════
   The launch offer, in one place.

   `FoundingOffer.tsx` states the terms on the public site; this file
   is what the owner app enforces, so the price a founding owner sees
   at checkout is the price the site promised them.

   A place is taken when a free inspection is booked, not at sign-up —
   an account that never books holds nothing — and cancelling gives it
   back. The count the app shows is that count, and nothing else.

   When all of them are booked the offer closes by itself. To end it
   for good, delete the marketing component; every screen reads
   `spotsLeft()` and `eligible()`.
   ════════════════════════════════════════════════════════════════ */

import type { User, Property, Visit, VisitKind } from "@/lib/types";
import { sameCity } from "@/lib/city";

export const LIMIT = 25;

/** Free inspections booked before the app existed — arranged with owners
    on WhatsApp. They are real bookings, so they count against the 25. */
export const BEFORE_APP = 7;

/** Any home in Bengaluru, whatever its size — rooms past a big layout
    included — and the visit has to be a single inspection: not a yearly
    plan, not a clean, not a plot walk. */
export const CITY = "Bengaluru";
export const FREE_PLAN = "one-time";

export const terms = [
  "One free inspection per owner — not one per visit",
  "Any home in Bengaluru, whatever its size",
  "The full 42-item check, photos and video of every room, report within the hour",
  "The whole visit recorded on a body camera, start to finish — and you get the full video",
  "Any repair you approve is at the professional's cost, with no StillYours fee",
  "No card needed. It never turns into a paid plan unless you choose one",
];

/** How many of the LIMIT are booked: the WhatsApp ones, plus every free
    inspection booked in the app and not cancelled — by the owner, or by
    ops when a booking turns out not to be genuine. */
export function freeBooked(visits: Pick<Visit, "founding" | "status">[]) {
  return Math.min(LIMIT, BEFORE_APP + visits.filter((v) => v.founding && v.status !== "cancelled").length);
}
export const spotsLeft = (visits: Pick<Visit, "founding" | "status">[]) => LIMIT - freeBooked(visits);

/** Can this owner still book a free inspection? Only if they have not
    had theirs, ops has not taken it back, and there is a place left. */
export const hasFreeVisit = (u: Pick<User, "freeVisitUsedAt" | "freeRevokedAt">, left: number) =>
  !u.freeVisitUsedAt && !u.freeRevokedAt && left > 0;

/** …and does the booking in front of them actually qualify? */
export function eligible(
  u: Pick<User, "freeVisitUsedAt" | "freeRevokedAt">,
  left: number,
  p: Pick<Property, "kind" | "size" | "city"> | undefined,
  kind: VisitKind,
  planId: string
) {
  if (!hasFreeVisit(u, left) || !p) return false;
  return kind === "inspection" && planId === FREE_PLAN && qualifies(p);
}

/** Is this property the kind the free inspection covers? */
export const qualifies = (p: Pick<Property, "kind" | "size" | "city">) =>
  p.kind === "home" && sameCity(p.city, CITY);

/** Why an owner's booking does not qualify for the free inspection —
    said plainly, so nobody has to guess which of the terms caught them. */
export function blockedBecause(
  p: Pick<Property, "kind" | "size" | "city"> | undefined,
  kind: VisitKind,
  planId: string
): string | null {
  if (!p) return null;
  if (p.kind !== "home") return "The free inspection covers homes — a plot visit is charged normally.";
  if (!sameCity(p.city, CITY)) return `The free inspection is ${CITY} only for now.`;
  if (kind === "cleaning") return "Cleaning is not part of the free inspection.";
  if (kind !== "inspection" || planId !== FREE_PLAN) return "Your free visit is a one-time inspection. Pick that and it costs nothing.";
  return null;
}
