import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { VisitStatus } from "@/lib/types";

/* The small parts every owner screen is assembled from. Kept server-safe:
   nothing here needs state, so nothing here costs a client bundle. */

export function Panel({ className, children, ...rest }: React.ComponentProps<"section">) {
  return <section className={cn("card border border-line bg-white shadow-card", className)} {...rest}>{children}</section>;
}

/** `wrapMeta` lets the line under the title run on — for meta that carries
    numbers somebody has to read in full, not a caption. */
export function PanelHead({ title, meta, action, className, wrapMeta = false }: { title: React.ReactNode; meta?: React.ReactNode; action?: React.ReactNode; className?: string; wrapMeta?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b border-line px-5 py-4", className)}>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold tracking-[-0.01em]">{title}</div>
        {meta && <div className={cn("t-small mt-0.5", wrapMeta ? "leading-snug" : "truncate")}>{meta}</div>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ n, l, tone, className }: { n: React.ReactNode; l: string; tone?: "pass" | "warn" | "fail" | "accent"; className?: string }) {
  return (
    <div className={cn("rounded-[14px] bg-paper px-4 py-3.5", className)}>
      <div className={cn("text-[26px] font-medium leading-none tracking-[-0.04em] tabular-nums",
        tone === "pass" && "text-pass", tone === "warn" && "text-warn", tone === "fail" && "text-fail", tone === "accent" && "text-accent")}>{n}</div>
      <div className="t-small mt-1.5">{l}</div>
    </div>
  );
}

/* One vocabulary for visit state across the dashboard, the list and the
   visit page, so a status never means two things in two places. */
const VISIT_LOOK: Record<VisitStatus, { label: string; chip: string; live?: boolean }> = {
  unpaid: { label: "Pay to confirm", chip: "chip-warn" },
  scheduled: { label: "Scheduled", chip: "" },
  assigned: { label: "Inspector assigned", chip: "chip-accent" },
  en_route: { label: "On the way", chip: "chip-warn", live: true },
  on_site: { label: "On site now", chip: "chip-accent", live: true },
  /* only a report held for review stays here — an active inspector's
     goes straight to "ready" */
  submitted: { label: "Report being checked", chip: "chip-warn", live: true },
  ready: { label: "Report ready", chip: "chip-pass" },
  closed: { label: "Closed", chip: "chip-pass" },
  cancelled: { label: "Cancelled", chip: "chip-fail" },
};
export const visitLook = (s: VisitStatus) => VISIT_LOOK[s];

export function StatusPill({ status, className }: { status: VisitStatus; className?: string }) {
  const v = VISIT_LOOK[status];
  return (
    <span className={cn("chip", v.chip, v.live && "relative", className)}>
      {v.live && <span className="ping absolute left-[11px] top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full" />}
      {v.label}
    </span>
  );
}

export function Empty({ icon: I, title, body, cta }: { icon: React.ComponentType<{ size?: number }>; title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-tint text-accent"><I size={22} /></span>
      <h3 className="serif mt-5 text-[24px] tracking-[-0.03em]">{title}</h3>
      <p className="t-small mx-auto mt-2 max-w-[42ch]">{body}</p>
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}

export function RowLink({ href, children, className }: { href: Route; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-3 px-5 py-4 transition hover:bg-paper", className)}>
      {children}
      <ArrowUpRight size={16} className="ml-auto shrink-0 text-text-3 transition group-hover:text-accent" />
    </Link>
  );
}

export function PageHead({ eyebrow, title, lede, action }: { eyebrow?: string; title: React.ReactNode; lede?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="min-w-0">
        {eyebrow && <div className="t-label uppercase tracking-[0.08em] text-text-3">{eyebrow}</div>}
        <h1 className="serif mt-1.5 text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.05] tracking-[-0.035em]">{title}</h1>
        {lede && <p className="t-small mt-2 max-w-[56ch]">{lede}</p>}
      </div>
      {action}
    </div>
  );
}

export { money } from "@/components/app/money";
