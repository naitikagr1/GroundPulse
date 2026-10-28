"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Bell, Check, RotateCcw, X } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/shared/SectionHead";
import { EvidenceFrame } from "@/components/ui/EvidenceFrame";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion";
import { BOX, SHOT } from "@/lib/photos";

type Phase = "pending" | "confirm" | "requested" | "assigned" | "progress" | "completed" | "declined";
const order: Phase[] = ["requested", "assigned", "progress", "completed"];
const labels = ["Requested", "Assigned", "In progress", "Completed"];

export function WhenWrong() {
  const [phase, setPhase] = useState<Phase>("pending");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const approve = () => {
    timers.current.forEach(clearTimeout);
    setPhase("requested");
    timers.current = [window.setTimeout(() => setPhase("assigned"), 1300), window.setTimeout(() => setPhase("progress"), 2700), window.setTimeout(() => setPhase("completed"), 4300)];
  };
  const reset = () => { timers.current.forEach(clearTimeout); setPhase("pending"); };
  const idx = order.indexOf(phase);

  return (
    <section className="section pb-0 md:pb-0" aria-labelledby="wrong-title">
      <div className="wrap">
        <SectionHead title={<span id="wrong-title">What happens when something's wrong</span>} lede="No calls from unknown numbers. No caretaker deciding for you. Just proof, a question, and a verified professional — in that order." />

        <div className="mt-12 grid gap-4 md:mt-16 lg:grid-cols-3 lg:gap-5">
          {/* 1 — flagged */}
          <Reveal>
            <div className="card shadow-card h-full bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-accent">Step 1</span><span className="chip chip-fail">Fail · Water leakage</span></div>
              <h3 className="t-3 mt-3">The inspector flags it — with proof.</h3>
              <div className="mt-4 grid grid-cols-2 gap-1.5">
                <EvidenceFrame variant="bathroom" src={SHOT.bathLeak} dense id="0412" room="Bathroom" time="14:02" box={BOX.bathLeak} boxLabel="Leak" />
                <EvidenceFrame variant="bathroom" src={SHOT.bathLeakClose} dense id="0413" room="Close-up" time="14:03" box={BOX.bathLeakClose} boxLabel="Moisture" />
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-text-2">Slow drip from the trap joint under the basin — water is pooling on the floor and staining the tiles. Recommend replacing the trap and sealing.</p>
              <div className="mt-3 flex items-center gap-1.5 text-[12.5px] text-text-3"><BadgeCheck size={13} className="text-accent" /> Ravi K. · verified inspector · 14:02 IST</div>
            </div>
          </Reveal>

          {/* 2 — decide */}
          <Reveal delay={0.08}>
            <div className="card shadow-card h-full bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-accent">Step 2</span><span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-2"><Bell size={12} /> Notified in 0:41</span></div>
              <h3 className="t-3 mt-3">You decide. Approve, or decline with a reason.</h3>
              <div className="mt-4 rounded-[14px] bg-paper p-4">
                <div className="text-[13px] font-semibold">Issue on Ancestral Apartment</div>
                <div className="t-small mt-0.5">Water leakage · Bathroom · 2 photos, 1 video</div>
                <div className="mt-3 rounded-[10px] bg-white p-3 text-[12.5px]">
                  <div className="flex justify-between"><span className="text-text-2">Suresh M. (verified) · replace trap + seal</span><span>₹3,000</span></div>
                  <div className="mt-1 flex justify-between"><span className="text-text-2">Still Yours fee · 15%</span><span>₹450</span></div>
                  <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold"><span>You approve</span><span>₹3,450</span></div>
                </div>
                <div className="mt-3 min-h-[96px]">
                  <AnimatePresence mode="wait" initial={false}>
                    {phase === "pending" && (
                      <motion.div key="p" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="grid grid-cols-2 gap-2">
                        <button onClick={() => setPhase("confirm")} className="btn btn-accent h-11 px-3 text-[13.5px]"><Check size={14} /> Approve ₹3,300</button>
                        <button onClick={() => setPhase("declined")} className="btn btn-white h-11 px-3 text-[13.5px]"><X size={14} /> Decline</button>
                      </motion.div>
                    )}
                    {phase === "confirm" && (
                      <motion.div key="c" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="rounded-[10px] border border-line bg-white p-3.5 text-[13px] text-text-2">
                        This will notify an admin to assign a <span className="font-semibold text-ink">verified</span> provider. Continue?
                        <div className="mt-3 flex gap-2"><button onClick={approve} className="btn btn-accent h-9 px-4 text-[13px]">Continue</button><button onClick={() => setPhase("pending")} className="h-9 rounded-[8px] px-3 text-[13px] font-semibold text-text-2">Cancel</button></div>
                      </motion.div>
                    )}
                    {idx >= 0 && (
                      <motion.div key="f" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#157a44]"><span className="grid h-5 w-5 place-items-center rounded-full bg-pass text-white"><Check size={11} strokeWidth={3} /></span> Approved ₹3,300 · 16:22 IST</div>
                        <p className="t-small mt-2">Written to the audit log. Admin notified to assign a verified plumber in Indiranagar.</p>
                        <button onClick={reset} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-accent"><RotateCcw size={11} /> Replay</button>
                      </motion.div>
                    )}
                    {phase === "declined" && (
                      <motion.div key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                        <div className="text-[13px] font-semibold">Declined · "Will handle on my visit"</div>
                        <p className="t-small mt-2">Issue closed with your reason. Nothing scheduled, nobody dispatched — and the decision is on record.</p>
                        <button onClick={reset} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-accent"><RotateCcw size={11} /> Replay</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Reveal>

          {/* 3 — resolve */}
          <Reveal delay={0.16}>
            <div className={cn("card shadow-card h-full bg-white p-5 transition-opacity duration-500 sm:p-6", idx < 0 && "opacity-70")}>
              <div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-accent">Step 3</span><span className={cn("chip", phase === "completed" ? "chip-pass" : idx >= 0 ? "chip-accent" : "")}>{phase === "completed" ? "Completed" : idx >= 0 ? labels[idx] : "Waiting for you"}</span></div>
              <h3 className="t-3 mt-3">A verified pro fixes it — with your inspector in the room.</h3>
              <ol className="mt-4 grid grid-cols-4 gap-1">
                {labels.map((l, i) => (
                  <li key={l}>
                    <motion.div className="h-1.5 rounded-full" animate={{ backgroundColor: i <= idx ? "#1e9e5a" : "rgba(26,26,26,0.1)" }} transition={{ duration: 0.5 }} />
                    <div className={cn("mt-1.5 text-[10px] font-semibold uppercase tracking-[0.04em]", i <= idx ? "text-ink" : "text-text-3")}>{l}</div>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex items-center gap-3 rounded-[12px] bg-paper p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-bold text-white">SM</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[13.5px] font-semibold">Suresh M. <BadgeCheck size={13} className="text-accent" /></div>
                  <div className="t-small">Plumbing · Indiranagar · verified</div>
                </div>
              </div>
              <AnimatePresence>
                {phase === "completed" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }} className="mt-3 grid grid-cols-[1fr_1.4fr] gap-2">
                    <EvidenceFrame variant="bathroom" src={SHOT.bathFixed} dense id="AFTER_01" room="Fixed" time="12:48" tone="pass" box={BOX.bathFixed} boxLabel="Fixed" />
                    <div className="rounded-[10px] border border-line p-2.5 text-[12px] leading-relaxed text-text-2"><span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3">Completion note</span><br />Replaced P-trap, resealed joint, dried cabinet. Tested 20 min — no drip.</div>
                  </motion.div>
                )}
              </AnimatePresence>
              {phase !== "completed" && <p className="t-small mt-3">The work happens during a scheduled visit with the inspector on-site. You get an update at every step.</p>}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
