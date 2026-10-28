"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { FloorPlan } from "@/components/ui/FloorPlan";
import { Keys } from "@/components/ui/Keys";
import { cn } from "@/lib/cn";
import { EASE, viewportOnce } from "@/lib/motion";
import { START, START_LABEL } from "@/lib/start";

type Item = { t: string; when?: string; kind?: "tint" | "white" | "hatch" | "note"; h?: number };

const ours: Item[] = [
  { t: "Register your home or plot", when: "5 min", kind: "tint" },
  { t: "Verified inspector walks the rooms — or the boundary", when: "scheduled", kind: "tint" },
  { t: "Report in your inbox — photos & video attached", when: "≤ 1 hour", kind: "white" },
  { t: "Still Yours takes over from here", kind: "note" },
  { t: "You approve the repair", when: "1 tap", kind: "tint" },
  { t: "We find a verified local professional", when: "same day", kind: "tint" },
  { t: "Pro does the work during a visit — inspector present", when: "updates on WhatsApp", kind: "tint" },
  { t: "Verified pro fixes it. After-photos land in the same report!", when: "done", kind: "white" },
];
const theirs: Item[] = [
  { t: "Call a neighbour or the local agent", when: "whenever" },
  { t: "Agent: \"kirayedaar dilwayenge, tab inspection\" — takes commission, rarely shows up", when: "no work" },
  { t: "Wait for a reply", when: "3 days" },
  { t: "Get \"sab theek hai\" 👍", when: "no photos" },
  { t: "…silence. No photos, no timestamp.", kind: "hatch", h: 84 },
  { t: "Fly home to check", when: "2 days + ₹" },
  { t: "Find a plumber you trust", when: "?" },
  { t: "…no updates while the work happens.", kind: "hatch", h: 84 },
  { t: "Hope it got done. Repeat next quarter.", kind: "white" },
];

function Column({ title, items, accent, className }: { title: React.ReactNode; items: Item[]; accent?: boolean; className?: string }) {
  return (
    <div className={cn("border-l pl-4 sm:pl-5", accent ? "border-line-2" : "border-line", className)}>
      <div className={cn("mb-4 text-[22px] leading-none tracking-[-0.02em] sm:text-[26px]", accent ? "serif text-ink" : "font-medium text-text-2")}>{title}</div>
      <motion.ol className="space-y-2" variants={{ show: { transition: { staggerChildren: 0.07 } }, hidden: {} }} initial="hidden" whileInView="show" viewport={viewportOnce}>
        {items.map((it, i) => {
          const kind = it.kind ?? (accent ? "tint" : "grey");
          return (
            <motion.li key={i} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
              style={it.h ? { minHeight: it.h } : undefined}
              className={cn(
                "relative rounded-[12px] px-4 py-3.5 text-[15px] leading-snug",
                kind === "tint" && "bg-accent-tint",
                kind === "grey" && "bg-beige-2",
                kind === "hatch" && "hatch flex items-center rounded-[12px] text-[13px] text-text-2",
                kind === "white" && "bg-white font-medium shadow-card",
                kind === "note" && "flex items-center gap-3 px-0 py-1 text-[14px] text-text-2 before:h-px before:flex-1 before:bg-line-2 after:h-px after:flex-1 after:bg-line-2"
              )}>
              {kind === "note" ? <span className="whitespace-nowrap">{it.t}</span> : (
                <div className="flex items-start justify-between gap-3">
                  <span className={cn(kind === "tint" && it.t && "font-medium text-accent-2", (kind === "grey" || kind === "hatch") && "text-text-2")}>{it.t}</span>
                  {it.when && <span className="shrink-0 text-[13px] text-text-2">{it.when}</span>}
                </div>
              )}
            </motion.li>
          );
        })}
      </motion.ol>
    </div>
  );
}

export function Timeline() {
  /* On a phone the two columns would stack into one very long list — so
     it shows one at a time, and the other is a tap away. */
  const [side, setSide] = useState<"ours" | "theirs">("ours");
  return (
    <section className="section overflow-hidden" aria-labelledby="timeline-title">
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="relative lg:col-span-5">
          <Reveal>
            <p className="text-[20px] font-medium text-text-2 sm:text-[24px]">Still Yours lets you stay away with</p>
            <h2 id="timeline-title" className="t-1 mt-1">StillYours vs. the usual way</h2>
            <p className="t-lede mt-5 max-w-[40ch] text-text-2">A full report within the hour. You approve only what needs fixing. A verified pro does the rest — and shows you it's done.</p>
            <Link href={START} className="btn btn-accent mt-7">{START_LABEL}</Link>
          </Reveal>

          {/* polaroid + keys */}
          <div className="relative mt-10 h-[300px] sm:h-[340px] lg:mt-16 lg:h-[380px]">
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -2 }}
              whileInView={{ opacity: 1, y: 0, rotate: -6 }}
              viewport={viewportOnce}
              transition={{ duration: 1, delay: 0.2, ease: EASE }}
              className="absolute left-[18%] top-2 w-[min(78%,360px)] rounded-[6px] bg-white p-3 pb-12 shadow-[0_0_0_1px_rgba(100,57,31,0.18),0_30px_50px_-20px_rgba(74,40,20,0.45)] sm:left-[22%]"
            >
              <div className="overflow-hidden rounded-[3px] bg-beige"><FloorPlan className="scale-[1.02]" /></div>
              <div className="hand absolute bottom-3 left-0 right-0 -rotate-2 text-center text-[22px] leading-none text-ink sm:text-[26px]">Leak caught — fixed by Friday!</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20, rotate: -8 }} whileInView={{ opacity: 1, y: 0, rotate: -12 }} viewport={viewportOnce} transition={{ duration: 1, delay: 0.45, ease: EASE }} className="absolute bottom-0 left-[2%] w-[120px] sm:w-[150px]">
              <Keys />
            </motion.div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7 lg:gap-8">
          <div className="grid grid-cols-2 gap-1 rounded-[14px] bg-beige p-1 sm:hidden" role="tablist" aria-label="Which way">
            {([["ours", "Still Yours"], ["theirs", "Traditional"]] as const).map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={side === k} onClick={() => setSide(k)}
                className={cn("h-10 rounded-[11px] text-[14px] font-medium transition", side === k ? "bg-white text-ink shadow-card" : "text-text-2")}>
                {l}
              </button>
            ))}
          </div>
          <Column title="Still Yours" items={ours} accent className={cn(side !== "ours" && "max-sm:hidden")} />
          <Column title="Traditional" items={theirs} className={cn(side !== "theirs" && "max-sm:hidden")} />
        </div>
      </div>
    </section>
  );
}
