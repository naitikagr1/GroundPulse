"use client";
/* eslint-disable react-hooks/set-state-in-effect -- animation timelines: state is driven by timers/measurements inside effects by design */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Bell, Camera, Check, ChevronRight, Flag, MapPin, Upload, X } from "lucide-react";
import { EvidenceFrame } from "@/components/ui/EvidenceFrame";
import { HealthRing } from "@/components/ui/HealthRing";
import { cn } from "@/lib/cn";
import { BOX, SHOT } from "@/lib/photos";

/* ────────────────────────────────────────────────────────────────
   "Living" product mocks for the home page. Each pair of cards plays a
   choreographed sequence when scrolled into view (typing, taps, uploads,
   toasts), loops while visible, and tilts gently under the cursor.
   ──────────────────────────────────────────────────────────────── */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Advances `phase` through `marks` (seconds) while `active`; loops at `loopAt`. */
function useTimeline(active: boolean, marks: number[], loopAt: number) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reduced()) { setPhase(marks.length); return; }
    let timers: number[] = [];
    const run = () => {
      setPhase(0);
      timers = marks.map((m, i) => window.setTimeout(() => setPhase(i + 1), m * 1000));
      timers.push(window.setTimeout(run, loopAt * 1000));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [active, marks, loopAt]);
  return phase;
}

/** A soft "finger" that glides to the element with data-t=target inside `container`. */
function Pointer({ container, target, pressed }: { container: React.RefObject<HTMLDivElement | null>; target: string | null; pressed?: boolean }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    if (!container.current || !target) { setPos(null); return; }
    const el = container.current.querySelector<HTMLElement>(`[data-t="${target}"]`);
    if (!el) { setPos(null); return; }
    const c = container.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPos({ x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 });
  }, [container, target]);
  return (
    <AnimatePresence>
      {pos && (
        <motion.div
          key="ptr"
          className="pointer-events-none absolute left-0 top-0 z-20 -ml-3 -mt-3 h-6 w-6"
          initial={{ opacity: 0, x: pos.x, y: pos.y, scale: 0.6 }}
          animate={{ opacity: 1, x: pos.x, y: pos.y, scale: pressed ? 0.8 : 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.6 }}
        >
          <span className="absolute inset-0 rounded-full bg-ink/85 shadow-[0_6px_18px_-4px_rgba(35,32,29,.6)] ring-2 ring-white" />
          {pressed && <motion.span className="absolute inset-0 rounded-full bg-ink/40" initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Mouse-tilt wrapper (desktop only). */
function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 160, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 160, damping: 18 });
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => { mx.set(0); my.set(0); };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={reset} style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }} whileHover={{ y: -4 }} transition={{ duration: 0.5, ease: EASE }} className={cn("relative will-change-transform", className)}>
      {children}
    </motion.div>
  );
}

const Card = ({ title, meta, children, className, live }: { title: string; meta?: React.ReactNode; children: React.ReactNode; className?: string; live?: boolean }) => (
  <div className={cn("card relative overflow-hidden bg-white shadow-[0_0_0_1px_rgba(100,57,31,0.14),0_24px_48px_-24px_rgba(74,40,20,0.35)]", className)}>
    <div className="flex items-center justify-between border-b border-line px-3 py-3 sm:px-4">
      <span className="flex items-center gap-2 text-[13.5px] font-semibold">{live && <span className="ping relative inline-block h-2 w-2 rounded-full bg-pass text-pass" />}{title}</span>
      {meta && <span className="text-[12px] tabular-nums text-text-3">{meta}</span>}
    </div>
    <div className="p-3 sm:p-4">{children}</div>
  </div>
);
const Lbl = ({ c }: { c: string }) => <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">{c}</div>;

function useTypewriter(text: string, go: boolean, speed = 38) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!go) { setN(0); return; }
    if (reduced()) { setN(text.length); return; }
    let i = 0;
    const id = window.setInterval(() => { i += 1; setN(i); if (i >= text.length) clearInterval(id); }, speed);
    return () => clearInterval(id);
  }, [go, text, speed]);
  return text.slice(0, n);
}

function useCount(to: number, go: boolean, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!go) { setV(0); return; }
    if (reduced()) { setV(to); return; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / ms); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, go, ms]);
  return v;
}

const pop = { initial: { opacity: 0, y: 8, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.45, ease: EASE } };

/* ── Step 01: Register + Schedule ─────────────────────────────── */
// phases: 1 typing · 2 point type · 3 type picked · 4 upload · 5 uploaded · 6 point save · 7 saved · 8 point day · 9 day picked · 10 point quarterly · 11 quarterly · 12 toast · 13 assigned
const M1 = [0.3, 2.3, 2.8, 3.4, 4.7, 5.2, 5.7, 6.4, 6.9, 7.5, 8.0, 8.6, 9.6];

export function RegisterScheduleLive() {
  const ref = useRef<HTMLDivElement>(null);
  const c1 = useRef<HTMLDivElement>(null);
  const c2 = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const p = useTimeline(inView, M1, 13.5);
  const addr = useTypewriter("C-14 Indiranagar, Bengaluru", p >= 1);
  const [secs, setSecs] = useState(0);
  useEffect(() => { if (!inView) return; const id = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(id); }, [inView]);
  const timer = `${Math.floor((252 + secs) / 60)}:${String((252 + secs) % 60).padStart(2, "0")}`;

  const target1 = p === 2 || p === 3 ? "apt" : p === 4 ? "cover" : p === 6 || p === 7 ? "save" : null;
  const target2 = p === 8 || p === 9 ? "d14" : p === 10 || p === 11 ? "q" : null;
  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div ref={ref} className="grid gap-3 sm:grid-cols-2">
      <Tilt>
        <div ref={c1} className="relative">
          <Card title="Add property" meta={<span className={cn(p >= 7 && "text-pass")}>{p >= 7 ? "Saved ✓" : timer}</span>}>
            <Lbl c="Address" />
            <div className={cn("flex h-10 items-center gap-2 rounded-[10px] border px-3 text-[13px] transition-colors", p >= 1 && p < 3 ? "border-accent ring-4 ring-accent/10" : "border-line-2")}>
              <MapPin size={13} className="text-text-3" />
              <span className="truncate">{addr}</span>
              {p >= 1 && addr.length < 27 && <motion.span className="ml-px inline-block h-4 w-[1.5px] bg-ink" animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} />}
            </div>
            <div className="mt-3"><Lbl c="Type" />
              <div className="grid grid-cols-3 gap-1.5">
                {["Apartment", "Villa", "House"].map((t, i) => {
                  const on = i === 0 && p >= 3;
                  return <motion.span key={t} data-t={i === 0 ? "apt" : undefined} animate={{ scale: on && p === 3 ? [1, 0.94, 1] : 1 }} transition={{ duration: 0.35 }} className={cn("flex h-9 items-center justify-center rounded-[10px] border text-[12px] font-medium transition-colors duration-300", on ? "border-accent bg-accent-soft text-accent-2" : "border-line-2 text-text-2")}>{t}</motion.span>;
                })}
              </div>
            </div>
            <div className="mt-3"><Lbl c="Cover photo" />
              <div data-t="cover" className="relative overflow-hidden rounded-[10px]">
                <EvidenceFrame variant="entrance" src="/photos/exterior.jpg" id="COVER" room="Cover photo" time={p >= 5 ? "uploaded" : p >= 4 ? "uploading…" : "tap to add"} tone="pass" ratio="16 / 6" />
                <AnimatePresence>
                  {p === 4 && (
                    <motion.div key="up" className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="w-[70%]">
                        <div className="flex items-center justify-between text-[11px] font-medium"><span className="inline-flex items-center gap-1"><Upload size={11} /> IMG_2041.jpg</span><span>2.4 MB</span></div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10"><motion.div className="h-full bg-accent" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.1, ease: "easeInOut" }} /></div>
                      </div>
                    </motion.div>
                  )}
                  {p >= 5 && <motion.span key="ok" {...pop} className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-pass px-2 py-0.5 text-[10.5px] font-semibold text-white"><Check size={10} strokeWidth={3} /> Uploaded</motion.span>}
                </AnimatePresence>
              </div>
            </div>
            <motion.span data-t="save" animate={{ scale: p === 6 ? 0.97 : 1 }} className={cn("mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] text-[13px] font-semibold text-white transition-colors duration-300", p >= 7 ? "bg-pass" : "bg-accent")}>
              {p >= 7 ? <><Check size={14} strokeWidth={3} /> Property saved</> : <>Save property <ChevronRight size={14} /></>}
            </motion.span>
          </Card>
          <Pointer container={c1} target={target1} pressed={p === 3 || p === 7 || p === 4} />
        </div>
      </Tilt>

      <Tilt>
        <div ref={c2} className="relative">
          <Card title="Schedule inspection" meta="October" live={p >= 12}>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="pb-1 text-[10px] font-semibold text-text-3">{d}</span>)}
              {days.map((d, i) => {
                const sel = d === 14 && p >= 9;
                return (
                  <motion.span key={d} data-t={d === 14 ? "d14" : undefined} initial={false} animate={{ scale: sel && p === 9 ? [1, 0.85, 1.08, 1] : 1 }} transition={{ duration: 0.45, delay: 0 }} className={cn("grid h-7 place-items-center rounded-[7px] text-[12px] tabular-nums transition-colors duration-300", d < 9 ? "text-text-3 line-through" : "text-ink", sel && "bg-accent font-semibold text-white", d === 14 && p === 8 && "ring-2 ring-accent/40")} style={{ transitionDelay: `${i * 6}ms` }}>{d}</motion.span>
                );
              })}
            </div>
            <div className="mt-3"><Lbl c="Recurrence" />
              <div className="grid grid-cols-4 gap-1.5">
                {["None", "Weekly", "Monthly", "Quarterly"].map((t, i) => {
                  const on = i === 3 && p >= 11;
                  return <motion.span key={t} data-t={i === 3 ? "q" : undefined} animate={{ scale: on && p === 11 ? [1, 0.94, 1] : 1 }} className={cn("flex h-9 items-center justify-center rounded-[10px] border text-[11.5px] font-medium transition-colors duration-300", on ? "border-accent bg-accent-soft text-accent-2" : "border-line-2 text-text-2")}>{t}</motion.span>;
                })}
              </div>
            </div>
            <div className="mt-3 min-h-[44px]">
              <AnimatePresence mode="wait">
                {p >= 13 ? (
                  <motion.div key="a" {...pop} className="flex items-center gap-2.5 rounded-[10px] bg-accent-tint px-3 py-2.5 text-[12.5px] font-medium text-accent-2">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-bold text-white">RK</span>
                    Ravi K. assigned · police-verified · Thu 14 Oct, 10:30
                  </motion.div>
                ) : p >= 12 ? (
                  <motion.div key="t" {...pop} className="flex items-center gap-2.5 rounded-[10px] bg-pass-soft px-3 py-2.5 text-[12.5px] font-medium text-[#157a44]">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-pass text-white"><Check size={11} strokeWidth={3} /></span> Scheduled — finding a verified inspector…
                  </motion.div>
                ) : (
                  <motion.div key="e" {...pop} className="flex h-[44px] items-center rounded-[10px] border border-dashed border-line-2 px-3 text-[12px] text-text-3">Pick a date and a rhythm</motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
          <Pointer container={c2} target={target2} pressed={p === 9 || p === 11} />
        </div>
      </Tilt>
    </div>
  );
}

/* ── Step 02: Inspect + Report ────────────────────────────────── */
type S = 0 | 1 | 2;
const rows: { room: string; item: string; s: S; media: string }[] = [
  { room: "Kitchen", item: "Sink & plumbing", s: 0, media: "1 photo" },
  { room: "Bathroom", item: "Sink & plumbing", s: 1, media: "2 photos · 1 video" },
  { room: "Bedroom", item: "Window locks", s: 2, media: "1 photo" },
  { room: "Balcony", item: "Railing & drainage", s: 0, media: "1 photo" },
];
// phases: 1..4 rows filled · 5 flag pulse · 6 submitted · 7 report compiling · 8 report ready · 9 notified
const M2 = [0.6, 1.5, 2.4, 3.3, 4.0, 5.0, 5.6, 7.2, 8.6];

const Seg = ({ s, on, id }: { s: S; on: boolean; id: string }) => (
  <div data-t={id} className="grid grid-cols-3 overflow-hidden rounded-[8px] border border-line-2 text-[10.5px] font-semibold">
    {(["Pass", "Fail", "Attn"] as const).map((l, i) => {
      const active = on && s === i;
      return (
        <motion.span key={l} animate={{ scale: active ? [1, 0.9, 1] : 1 }} transition={{ duration: 0.3 }} className={cn("flex h-7 items-center justify-center gap-1 transition-colors duration-300", i !== 0 && "border-l border-line-2", active && i === 0 && "bg-pass text-white", active && i === 1 && "bg-fail text-white", active && i === 2 && "bg-warn text-white", !active && "text-text-3")}>
          {active && (i === 0 ? <Check size={10} strokeWidth={3} /> : i === 1 ? <X size={10} strokeWidth={3} /> : <Flag size={10} strokeWidth={3} />)}{l}
        </motion.span>
      );
    })}
  </div>
);

export function InspectReportLive() {
  const ref = useRef<HTMLDivElement>(null);
  const c1 = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const p = useTimeline(inView, M2, 12.5);
  const done = 38 + Math.min(4, Math.max(0, p));
  const pass = useCount(39, p >= 8), attn = useCount(2, p >= 8, 700), fail = useCount(1, p >= 8, 600);
  const [secs, setSecs] = useState(0);
  useEffect(() => { if (!inView) return; const id = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(id); }, [inView]);
  const t = 37 * 60 + 12 + secs;
  const timer = `00:${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  const target = p >= 1 && p <= 4 ? `r${p - 1}` : p === 5 ? "flag" : p === 6 ? "submit" : null;

  return (
    <div ref={ref} className="grid gap-3 sm:grid-cols-2">
      <Tilt>
        <div ref={c1} className="relative">
          <Card title="Checklist · on-site" meta={<span className={cn(p >= 6 && "text-pass")}>{p >= 6 ? "Submitted ✓" : timer}</span>} live={p < 6}>
            <div className="divide-y divide-line">
              {rows.map((r, i) => (
                <div key={i} className={cn("flex items-center justify-between gap-3 py-2.5 transition-opacity duration-500", p < i + 1 && p < 6 && "opacity-60")}>
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px]"><span className="text-text-3">{r.room} · </span>{r.item}</div>
                    <div className="mt-0.5 flex h-[14px] items-center gap-1 text-[10.5px] text-text-3">
                      <AnimatePresence>{p >= i + 1 && <motion.span key="m" {...pop} className="inline-flex items-center gap-1"><Camera size={9} /> {r.media}</motion.span>}</AnimatePresence>
                    </div>
                  </div>
                  <div className="w-[104px] shrink-0 sm:w-[136px]"><Seg s={r.s} on={p >= i + 1} id={`r${i}`} /></div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="t-small tabular-nums">42 items · {done} done</span>
              <div className="flex items-center gap-2">
                <AnimatePresence>{p === 2 && <motion.span key="fl" {...pop} className="chip chip-fail">Leak flagged</motion.span>}</AnimatePresence>
                <motion.span data-t="flag" animate={{ scale: p === 5 ? [1, 1.06, 1] : 1 }} transition={{ duration: 0.6, repeat: p === 5 ? 2 : 0 }} className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-fail px-3 text-[12px] font-semibold text-white"><Flag size={12} /> Flag issue</motion.span>
              </div>
            </div>
            <motion.span data-t="submit" animate={{ scale: p === 6 ? 0.97 : 1 }} className={cn("mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] text-[13px] font-semibold transition-colors duration-300", p >= 6 ? "bg-pass text-white" : p >= 4 ? "bg-accent text-white" : "bg-beige text-text-3")}>
              {p >= 6 ? <><Check size={14} strokeWidth={3} /> Submitted · report compiling</> : p >= 4 ? <>Submit visit <ChevronRight size={14} /></> : "Complete all slots to submit"}
            </motion.span>
          </Card>
          <Pointer container={c1} target={target} pressed={p >= 1 && p <= 6} />
        </div>
      </Tilt>

      <Tilt>
        <div className="relative">
          <Card title="Inspection report" meta={p >= 8 ? "38 min after visit" : "—"} live={p >= 8}>
            <AnimatePresence mode="wait">
              {p < 7 ? (
                <motion.div key="w" {...pop} className="grid min-h-[236px] place-items-center text-center">
                  <div><div className="mx-auto h-12 w-12 rounded-full bg-beige" /><div className="mt-3 text-[13px] text-text-2">Waiting for the visit to finish…</div></div>
                </motion.div>
              ) : p < 8 ? (
                <motion.div key="c" {...pop} className="grid min-h-[236px] place-items-center text-center">
                  <div>
                    <motion.div className="mx-auto h-12 w-12 rounded-full border-[3px] border-accent border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} />
                    <div className="mt-3 text-[13px] font-medium">Compiling report</div>
                    <div className="mt-1 text-[12px] text-text-2">10 videos · 42 items · health score</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="r" {...pop}>
                  <div className="flex items-center gap-4">
                    <HealthRing score={84} size={84} stroke={7} delay={0.1} />
                    <div className="grid flex-1 grid-cols-3 gap-1.5">
                      {[[pass, "Pass", "text-pass"], [attn, "Attn", "text-warn"], [fail, "Fail", "text-fail"]].map(([n, l, c]) => <div key={l as string} className="rounded-[10px] bg-paper px-2.5 py-2"><div className={cn("text-[1.3rem] font-bold leading-none tracking-[-0.03em] tabular-nums", c as string)}>{n as number}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3">{l as string}</div></div>)}
                    </div>
                  </div>
                  <motion.div className="mt-3 grid grid-cols-4 gap-1.5" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } }, hidden: {} }}>
                    {[
                      <EvidenceFrame key="k" variant="kitchen" dense tone="pass" id="0398" room="Kitchen" time="13:51" />,
                      <EvidenceFrame key="b" variant="bathroom" src={SHOT.bathLeak} dense id="0412" room="Bath" time="14:02" box={BOX.bathLeak} boxLabel="Leak" />,
                      <EvidenceFrame key="d" variant="bedroom" src={SHOT.bedroom} dense tone="attn" id="0406" room="Bed" time="13:57" box={BOX.bedroomLock} boxLabel="Lock" />,
                      <EvidenceFrame key="y" variant="balcony" dense tone="pass" id="0421" room="Balcony" time="14:11" />,
                    ].map((el, i) => <motion.div key={i} variants={{ hidden: { opacity: 0, y: 10, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } } }}>{el}</motion.div>)}
                  </motion.div>
                  <div className="mt-3 flex items-center justify-between rounded-[10px] border border-line px-3 py-2 text-[12px]">
                    <span className="inline-flex items-center gap-1.5 text-text-2"><motion.span animate={p >= 9 ? { rotate: [0, -18, 14, -8, 0] } : {}} transition={{ duration: 0.7 }}><Bell size={11} /></motion.span>{p >= 9 ? "Sent to Priya · WhatsApp + email" : "Sending to owner…"}</span>
                    <AnimatePresence mode="wait">{p >= 9 ? <motion.span key="rd" {...pop} className="chip chip-pass">Ready</motion.span> : <motion.span key="sn" {...pop} className="chip">Sending</motion.span>}</AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </Tilt>
    </div>
  );
}
