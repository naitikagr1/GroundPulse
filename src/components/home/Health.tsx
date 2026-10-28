"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { HealthRing } from "@/components/ui/HealthRing";
import { EASE, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { SHOT } from "@/lib/photos";

const points = [{ l: "Jan", v: 71 }, { l: "Apr", v: 76 }, { l: "Jul", v: 79 }, { l: "Oct", v: 84 }];

function Trend() {
  const W = 520, H = 170, px = 30, py = 24;
  const xs = points.map((_, i) => px + (i * (W - px * 2)) / (points.length - 1));
  const ys = points.map((p) => py + (H - py * 2) * (1 - (p.v - 60) / 40));
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x} ${ys[i]}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-label="Health score trend across four inspections">
      {[60, 70, 80, 90, 100].map((g) => { const y = py + (H - py * 2) * (1 - (g - 60) / 40); return <g key={g}><line x1={px} x2={W - px} y1={y} y2={y} stroke="rgba(26,26,26,0.07)" /><text x={px - 8} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(26,26,26,0.4)" fontFamily="var(--font-sans)">{g}</text></g>; })}
      <motion.path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={viewportOnce} transition={{ duration: 1.6, ease: EASE, delay: 0.2 }} />
      {points.map((p, i) => (
        <motion.g key={p.l} initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={viewportOnce} transition={{ delay: 0.4 + i * 0.35, duration: 0.5, ease: EASE }} style={{ transformOrigin: `${xs[i]}px ${ys[i]}px` }}>
          <circle cx={xs[i]} cy={ys[i]} r="6" fill="#fff" stroke="var(--accent)" strokeWidth="2.5" />
          <text x={xs[i]} y={ys[i] - 14} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-sans)">{p.v}</text>
          <text x={xs[i]} y={H - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="rgba(26,26,26,0.45)" fontFamily="var(--font-sans)">{p.l}</text>
        </motion.g>
      ))}
    </svg>
  );
}

const portfolio = [
  { n: "Ancestral Apartment", a: "Indiranagar, Bengaluru", s: 84, open: 1, last: "2 days ago", v: "entrance" as const, src: SHOT.living },
  { n: "Garden Villa", a: "Whitefield, Bengaluru", s: 62, open: 2, last: "3 weeks ago", v: "balcony" as const, src: "/photos/goa.jpg" },
  { n: "Unit 3 · HSR Layout", a: "Bengaluru", s: 91, open: 0, last: "5 days ago", v: "living" as const, src: "/photos/pune.jpg" },
];

export function Health() {
  return (
    <section className="section" aria-labelledby="health-title">
      <div className="wrap">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="lg:col-span-5">
            <SectionHead title={<span id="health-title">One number that tells you the trend</span>} lede="Every completed inspection recalculates a 0–100 score for the property. You see a direction, not a pile of PDFs — and across a portfolio, you see which place needs you first." />
            <Reveal delay={0.15} className="mt-6 flex flex-wrap gap-2">
              <span className="chip chip-fail">0–40 needs attention</span><span className="chip chip-warn">40–70 watch</span><span className="chip chip-pass">70–100 healthy</span>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-7">
            <div className="card shadow-card bg-white p-5 sm:p-7">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <HealthRing score={84} size={132} stroke={11} label="Health" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between"><span className="text-[14px] font-semibold">Ancestral Apartment · last 4 inspections</span><span className="chip chip-pass">+13</span></div>
                  <Trend />
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-14 md:mt-20">
          <Reveal className="flex items-end justify-between gap-6">
            <h3 className="t-1">Every property, one glance</h3>
            <Link href="/owners" className="btn btn-accent btn-sm hidden sm:inline-flex">For owners <ArrowRight size={15} /></Link>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {portfolio.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.08}>
                <article className="card shadow-card group overflow-hidden bg-white transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:-translate-y-1">
                  <div className="relative" style={{ aspectRatio: "16 / 9" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt={p.n} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-medium backdrop-blur">Cover · {p.last}</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0"><div className="truncate text-[16px] font-semibold">{p.n}</div><div className="t-small mt-0.5 truncate">{p.a}</div></div>
                      <HealthRing score={p.s} size={56} stroke={5} delay={0.3 + i * 0.15} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2"><span className="chip">Inspected {p.last}</span>{p.open > 0 ? <span className={cn("chip", p.open > 1 ? "chip-warn" : "chip-fail")}>{p.open} open</span> : <span className="chip chip-pass">No issues</span>}</div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
