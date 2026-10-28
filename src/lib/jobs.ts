/* ════════════════════════════════════════════════════════════════
   How many jobs an inspector can hold, and what missing one costs.

   · Up to five claimed at once, only one under way — "on the way" or
     "on site" — at a time. A house is never half-walked for another.
   · Two at once until ₹1,500 of the deposit is in — enough to cover
     five no-shows at ₹250. An empty one covers none, so two is the most
     we risk on somebody new. The deposit keeps building to ₹5,000 after.
   · At most three on any one day, and never two in the same window:
     nobody can be in two places.
   · Handing a job back is free until 24 hours before its window opens.
     After that it costs ₹150 from the deposit.
   · Not turning up — the window closes with no check-in — costs ₹250,
     the job leaves them, and the owner may move or cancel it free, even
     on the day. Someone who pressed "on the way" gets 45 minutes past
     the window, so traffic is not a no-show. Two of those in 30 days
     pauses the inspector, and the rest of what they hold goes back on
     the board.
   · A deposit can go below zero; it is made good from the next jobs,
     half of each one's pay (see DEPOSIT in lib/payout).
   · Ops can take a deduction back — an accident, a hospital. A waived
     miss does not count towards a pause.

   Everything that writes runs inside `mutate`, on the store it is given.
   ════════════════════════════════════════════════════════════════ */

import { db, mutate, now, uid } from "@/lib/store";
import { pushEvent } from "@/lib/events";
import { fmtDayDate } from "@/lib/format";
import { inr } from "@/lib/pricing";
import { DEPOSIT, HOLD, PENALTY } from "@/lib/payout";
import type { DB, Inspector, Penalty, Visit } from "@/lib/types";

/* The numbers live with the pay rules in lib/payout, where a page that
   runs in the browser — the inspector application — can read them too. */
export { HOLD, PENALTY };

/** How many this inspector may hold at once — fewer until ₹1,500 of the deposit is in. */
export const holdMax = (ins: Pick<Inspector, "depositInr">) => (ins.depositInr >= DEPOSIT.unlock ? HOLD.max : HOLD.untilUnlock);

/** Claimed or under way — in the inspector's hands. */
export const HELD: Visit["status"][] = ["assigned", "en_route", "on_site"];
/** Under way — only ever one. */
export const UNDER_WAY: Visit["status"][] = ["en_route", "on_site"];

/** When a visit's window opens and closes. Slots read "10:00 – 13:00", IST. */
export const windowStart = (v: Pick<Visit, "scheduledFor" | "slot">) => Date.parse(`${v.scheduledFor}T${v.slot.slice(0, 5)}:00+05:30`);
export const windowEnd = (v: Pick<Visit, "scheduledFor" | "slot">) => Date.parse(`${v.scheduledFor}T${v.slot.slice(-5)}:00+05:30`);

/** Until when a claimed job can be handed back for free. */
export const freeReleaseUntil = (v: Pick<Visit, "scheduledFor" | "slot">) => windowStart(v) - PENALTY.freeReleaseHours * 3_600_000;
export const freeToHandBack = (v: Pick<Visit, "scheduledFor" | "slot">) => Date.now() < freeReleaseUntil(v);

/** Why this inspector cannot take this job right now, or null if they can. */
export function claimRefusal(d: Pick<DB, "visits">, ins: Pick<Inspector, "id" | "depositInr">, v: Pick<Visit, "id" | "scheduledFor" | "slot">): string | null {
  if (Date.now() >= windowEnd(v)) return "This visit's window has already closed.";
  const held = d.visits.filter((x) => x.inspectorId === ins.id && HELD.includes(x.status) && x.id !== v.id);
  const max = holdMax(ins);
  if (held.length >= max) {
    return max < HOLD.max
      ? `Until ${inr(DEPOSIT.unlock)} of your deposit is in, you can hold ${max} at a time. Finish one or hand one back first.`
      : `You are holding ${max} jobs — the most at once. Finish one or hand one back first.`;
  }
  if (held.some((x) => x.scheduledFor === v.scheduledFor && x.slot === v.slot)) return "You already have a job in that window on that day.";
  if (held.filter((x) => x.scheduledFor === v.scheduledFor).length >= HOLD.perDay) return `${HOLD.perDay} jobs on one day is the most.`;
  return null;
}

/** Take money off the deposit, and pause them after repeated no-shows. */
export function penalise(d: DB, ins: Inspector, v: Visit, kind: Penalty["kind"]) {
  const amountInr = kind === "no_show" ? PENALTY.noShow : PENALTY.lateRelease;
  const p: Penalty = { id: uid(), at: now(), visitId: v.id, ref: v.ref, kind, amountInr };
  ins.penalties = [...(ins.penalties ?? []), p];
  ins.depositInr -= amountInr;

  if (kind !== "no_show" || ins.status === "paused") return;
  const since = Date.now() - PENALTY.pauseWindowDays * 86_400_000;
  const recent = ins.penalties.filter((x) => x.kind === "no_show" && !x.waivedAt && Date.parse(x.at) >= since).length;
  if (recent < PENALTY.pauseAfter) return;
  ins.status = "paused";
  /* Paused people hold nothing that has not started. */
  for (const o of d.visits.filter((x) => x.inspectorId === ins.id && x.status === "assigned")) {
    o.status = "scheduled";
    o.inspectorId = "";
    o.claimedAt = null;
    const prop = d.properties.find((x) => x.id === o.propertyId);
    pushEvent(d, {
      ownerId: o.ownerId, propertyId: o.propertyId, visitId: o.id, type: "visit.assigned",
      title: "We are assigning a different inspector",
      body: `${prop?.label ?? "Your property"} · ${fmtDayDate(o.scheduledFor)} · ${o.slot} — the visit stays booked`,
      href: `/app/visits/${o.id}`,
    });
  }
}

/** Held, and its window closed with nobody checked in — with some grace
    for whoever had already set off. */
const missed = (v: Visit, t: number) =>
  !!v.inspectorId &&
  (v.status === "assigned" ? t >= windowEnd(v) : v.status === "en_route" && t >= windowEnd(v) + PENALTY.enRouteGraceMinutes * 60_000);

/** Hold back what the deposit is still short from a finished job's pay —
    half of what the job pays, until ₹5,000 is in. Overtime is never
    touched: it is paid in full. */
export function holdForDeposit(ins: Inspector, v: Visit) {
  const n = Math.max(0, Math.min(Math.round(v.payoutInr * DEPOSIT.rate), DEPOSIT.target - ins.depositInr));
  v.depositHeldInr = n;
  ins.depositInr += n;
}

/** Settle every no-show whose window has closed. Cheap when there is
    nothing to do — it reads first and writes only when it must. Called
    on the way into either app, so nobody needs a clock running. */
export async function sweepMissed() {
  const t = Date.now();
  if (!(await db()).visits.some((v) => missed(v, t))) return;
  await mutate((d) => {
    for (const v of d.visits.filter((x) => missed(x, t))) {
      const ins = d.inspectors.find((x) => x.id === v.inspectorId);
      if (ins) penalise(d, ins, v, "no_show");
      v.status = "scheduled";
      v.inspectorId = "";
      v.claimedAt = null;
      v.missedAt = now();
      const prop = d.properties.find((x) => x.id === v.propertyId);
      pushEvent(d, {
        ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.assigned",
        title: "Our inspector could not make it — sorry",
        body: `${prop?.label ?? "Your property"} · ${fmtDayDate(v.scheduledFor)} · ${v.slot}. Move it to a new day at no charge, or cancel it for a full refund.`,
        href: `/app/visits/${v.id}`, action: true,
      });
    }
  });
}

export const penaltyLine = (p: Penalty) =>
  `${p.kind === "no_show" ? "Missed visit" : "Handed back late"} · ${p.ref} · ${p.waivedAt ? "taken back" : `−${inr(p.amountInr)}`}`;
