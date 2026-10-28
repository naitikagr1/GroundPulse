import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";

/* ════════════════════════════════════════════════════════════════
   The legal pages — Terms, Privacy, Refunds, Contact.

   One layout for all four: which document you are in, a table of
   contents that stays in view, numbered clauses you can link to, and
   the short version at the top for anyone who will not read the rest.
   ════════════════════════════════════════════════════════════════ */

export const LEGAL_UPDATED = "24 September 2026";

const DOCS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refunds & cancellations" },
  { href: "/contact", label: "Contact" },
] as const;

export type Toc = { id: string; title: string }[];

export function LegalPage({
  current, title, lede, toc, summary, children,
}: {
  current: (typeof DOCS)[number]["href"];
  title: string;
  lede: React.ReactNode;
  toc?: Toc;
  /** the short version, in plain words */
  summary?: React.ReactNode[];
  children: React.ReactNode;
}) {
  return (
    <div className="pt-[88px] md:pt-[100px]">
      <div className="wrap">
        {/* which document */}
        <nav aria-label="Legal documents" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {DOCS.map((d) => (
            <Link key={d.href} href={d.href as Route} aria-current={d.href === current ? "page" : undefined}
              className={cn("shrink-0 rounded-full px-4 py-2 text-[13.5px] font-medium transition",
                d.href === current ? "bg-ink text-white" : "text-text-2 hover:bg-beige hover:text-ink")}>
              {d.label}
            </Link>
          ))}
        </nav>

        <header className="mt-8 max-w-[780px]">
          <p className="t-label">Legal · {site.name}</p>
          <h1 className="serif mt-3 text-[clamp(2.1rem,5vw,3.2rem)] leading-[1.04] tracking-[-0.035em]">{title}</h1>
          <p className="t-lede mt-4 max-w-[62ch]">{lede}</p>
          <p className="t-small mt-4">Effective and last updated {LEGAL_UPDATED}</p>
        </header>

        <div className={cn("mt-10 grid gap-10 pb-6", toc && "lg:grid-cols-[230px_minmax(0,1fr)]")}>
          {toc && (
            <aside className="lg:sticky lg:top-[100px] lg:self-start">
              <details className="group rounded-[16px] border border-line bg-white p-4 lg:border-0 lg:bg-transparent lg:p-0" open>
                <summary className="t-label cursor-pointer list-none lg:pointer-events-none">Contents</summary>
                <ol className="mt-3 grid gap-1 text-[13.5px]">
                  {toc.map((t, i) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="flex gap-2 rounded-[8px] px-2 py-1 text-text-2 transition hover:bg-beige hover:text-ink">
                        <span className="w-5 shrink-0 tabular-nums text-text-3">{i + 1}.</span>{t.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            </aside>
          )}

          <article className="min-w-0 max-w-[780px]">
            {summary && (
              <div className="card mb-10 bg-accent-tint p-6 sm:p-7">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em]">The short version</h2>
                <p className="t-small mt-1">Plain words, not a substitute for the full text below — where they differ, the full text applies.</p>
                <ul className="mt-4 grid gap-2.5">
                  {summary.map((s, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-text-2">
                      <span className="mt-[9px] h-[6px] w-[6px] shrink-0 rounded-full bg-accent" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid gap-10">{children}</div>
            <p className="t-small mt-12 border-t border-line pt-6 leading-relaxed">
              {site.company} · run by {site.operator} · {site.address} · <a className="underline underline-offset-2 hover:text-ink" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}

/** A numbered clause. `id` is its anchor, and must match the table of contents. */
export function Clause({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="flex gap-3 text-[21px] font-semibold tracking-[-0.02em]">
        <span className="tabular-nums text-text-3">{n}.</span>{title}
      </h2>
      <div className="mt-4 grid gap-3.5 text-[15.5px] leading-[1.7] text-text-2 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_b]:font-semibold [&_b]:text-ink">
        {children}
      </div>
    </section>
  );
}

/** Numbered sub-points: 3.1, 3.2 … */
export function Points({ n, items }: { n: number; items: React.ReactNode[] }) {
  return (
    <ol className="grid gap-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3">
          <span className="w-9 shrink-0 tabular-nums text-text-3">{n}.{i + 1}</span>
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ol>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[11px] h-[5px] w-[5px] shrink-0 rounded-full bg-text-3" />
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** A two-column table for "situation → what happens" and data lists. */
export function Table({ head, rows }: { head: [string, string]; rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line">
      <table className="w-full text-left text-[14.5px] leading-relaxed">
        <thead className="bg-paper text-[13px] text-text-3">
          <tr><th className="px-4 py-2.5 font-medium">{head[0]}</th><th className="px-4 py-2.5 font-medium">{head[1]}</th></tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {rows.map(([a, b], i) => (
            <tr key={i} className="align-top">
              <td className="w-[42%] px-4 py-3 font-medium text-ink">{a}</td>
              <td className="px-4 py-3 text-text-2">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
