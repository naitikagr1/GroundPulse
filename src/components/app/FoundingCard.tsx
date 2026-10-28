import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Check, Gift } from "lucide-react";
import { qualifies, terms, LIMIT } from "@/lib/offer";
import { fmtDate } from "@/lib/format";
import type { User, Property } from "@/lib/types";
import { cn } from "@/lib/cn";

/* The launch offer, inside the account. It states which of *your*
   properties it actually covers — a term list that does not name the
   property is the kind of small print people feel cheated by later —
   and how many of the places are really gone: the count is the free
   inspections booked, WhatsApp ones included, and nothing added to it. */
export function FoundingCard({ user, properties, left, firstTime = false, compact = false }: {
  user: Pick<User, "freeVisitUsedAt" | "freeRevokedAt">;
  properties: Property[];
  /** places still free to book, across every owner */
  left: number;
  /** nothing booked yet — the only owners a closed offer is news to */
  firstTime?: boolean;
  compact?: boolean;
}) {
  const booked = LIMIT - left;
  /* ops cancelled their free booking as not genuine; the app says so on the visit itself */
  if (user.freeRevokedAt) return null;

  if (user.freeVisitUsedAt) {
    return (
      <section className="card border border-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pass-soft text-pass"><Check size={17} strokeWidth={3} /></span>
          <div className="grow basis-[15rem]">
            <div className="text-[15px] font-semibold">Free inspection claimed</div>
            <div className="t-small mt-0.5">One of our first {LIMIT} · booked {fmtDate(user.freeVisitUsedAt, { year: true })}</div>
          </div>
          <Link href="/app/book" className="btn btn-pill btn-sm shrink-0">Book another visit</Link>
        </div>
      </section>
    );
  }

  if (left < 1) {
    if (!firstTime) return null;
    return (
      <section className="card border border-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-beige text-text-2"><Gift size={17} /></span>
          <div className="grow basis-[15rem]">
            <div className="text-[15px] font-semibold">All {LIMIT} free inspections are booked</div>
            <div className="t-small mt-0.5 leading-snug">The launch offer has closed. Inspections are paid from here — you see the exact price before you book.</div>
          </div>
          {/* with no property yet, the page's own "Add a property" is the next step */}
          {properties.length > 0 && <Link href="/app/book" className="btn btn-pill btn-sm shrink-0">Book an inspection</Link>}
        </div>
        <Meter booked={booked} className="mt-4" />
      </section>
    );
  }

  const qualifying = properties.filter(qualifies);

  return (
    <section className={cn("on-dark card bg-ink shadow-float", compact ? "p-5" : "p-6 sm:p-7")}>
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/12 text-white"><Gift size={19} /></span>
        <div className="grow basis-[15rem]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/55">Launch offer · first {LIMIT} owners</p>
          <h2 className="serif mt-1.5 text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.08] tracking-[-0.03em] text-white">
            Your first inspection is free.
          </h2>
          <p className="mt-2 max-w-[48ch] text-[14.5px] leading-relaxed text-white/70">
            {qualifying.length
              ? <>It covers {qualifying.map((p) => p.label).join(", ")} — the full 42-item check, photos and video of every room, and the body camera thrown in.</>
              : <>It covers any home in Bengaluru, whatever its size. Add yours and the visit costs you nothing.</>}
          </p>
        </div>
        <Link
          href={(qualifying.length ? `/app/book?property=${qualifying[0].id}&plan=one-time` : "/app/properties/new?then=book") as Route}
          className="btn btn-white btn-sm shrink-0"
        >
          {qualifying.length ? "Book it free" : "Add a property"} <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between gap-3 text-[13px]">
          <span className="text-white/60"><b className="font-semibold text-white">{booked}</b> of {LIMIT} booked</span>
          <span className="font-semibold text-white">{left === 1 ? "The last one left" : `${left} left`}</span>
        </div>
        <Meter booked={booked} dark />
      </div>

      {!compact && (
        <ul className="mt-5 grid gap-2 border-t border-white/12 pt-5 sm:grid-cols-2">
          {terms.map((t) => (
            <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-white/75">
              <span className="mt-[3px] grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full bg-white/15"><Check size={10} strokeWidth={3} /></span>
              {t}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** One pill per place, filled for each one booked. */
function Meter({ booked, dark = false, className }: { booked: number; dark?: boolean; className?: string }) {
  return (
    <div role="img" aria-label={`${booked} of ${LIMIT} free inspections booked`} className={cn("grid gap-[3px]", className)} style={{ gridTemplateColumns: `repeat(${LIMIT}, minmax(0, 1fr))` }}>
      {Array.from({ length: LIMIT }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 rounded-full",
            i < booked ? (dark ? "bg-white" : "bg-accent") : dark ? "bg-white/15" : "bg-beige",
          )}
        />
      ))}
    </div>
  );
}
