"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Clock, Flag, Home, KeyRound, LandPlot, MapPin, Play, Video, X } from "lucide-react";
import { HealthRing } from "@/components/ui/HealthRing";
import { EvidenceFrame, type EvidenceVariant } from "@/components/ui/EvidenceFrame";
import { MapCard } from "@/components/ui/MapCard";
import { cn } from "@/lib/cn";
import { START, START_LABEL } from "@/lib/start";
import { BOX, SHOT } from "@/lib/photos";

type S = "pass" | "fail" | "attn";
const rooms: { name: string; v: EvidenceVariant; src?: string | null; dur: string; items: { t: string; s: S }[] }[] = [
  { name: "Entrance & hallway", v: "entrance", dur: "0:48", items: [{ t: "Main door & lock", s: "pass" }, { t: "Letterbox / notices", s: "pass" }, { t: "Signs of forced entry", s: "pass" }] },
  { name: "Living / dining", v: "living", dur: "1:12", items: [{ t: "Walls, ceiling, damp", s: "pass" }, { t: "Windows & latches", s: "pass" }, { t: "Sockets & switches", s: "pass" }] },
  { name: "Kitchen", v: "kitchen", dur: "1:05", items: [{ t: "Sink & plumbing", s: "pass" }, { t: "Gas connection (off)", s: "pass" }, { t: "Chimney & cabinets", s: "pass" }] },
  { name: "Bedroom 1", v: "bedroom", dur: "0:56", items: [{ t: "Window locks", s: "attn" }, { t: "AC unit", s: "pass" }, { t: "Wardrobe (closed)", s: "pass" }] },
  { name: "Bedroom 2", v: "bedroom", dur: "0:51", items: [{ t: "Window locks", s: "pass" }, { t: "Ceiling & walls", s: "pass" }, { t: "Wardrobe (closed)", s: "pass" }] },
  { name: "Bathroom 1", v: "bathroom", src: SHOT.bathLeak, dur: "1:20", items: [{ t: "Sink & plumbing", s: "fail" }, { t: "Taps & geyser", s: "pass" }, { t: "Drainage", s: "pass" }] },
  { name: "Bathroom 2", v: "bathroom", dur: "0:44", items: [{ t: "Sink & plumbing", s: "pass" }, { t: "Taps & geyser", s: "pass" }, { t: "Drainage", s: "pass" }] },
  { name: "Balcony", v: "balcony", dur: "0:38", items: [{ t: "Railing", s: "pass" }, { t: "Drainage", s: "pass" }, { t: "Plants / pests", s: "pass" }] },
  { name: "Parking · KA-03-MX-4421", v: "entrance", src: SHOT.car, dur: "0:42", items: [{ t: "Started & idled 10 min", s: "pass" }, { t: "Battery, tyres, leaks", s: "pass" }, { t: "Cover on, odometer 42,118", s: "pass" }] },
];
const chip = (s: S) => (s === "pass" ? "chip chip-pass" : s === "fail" ? "chip chip-fail" : "chip chip-warn");
const label = (s: S) => (s === "pass" ? "Pass" : s === "fail" ? "Fail" : "Attention");

function Meta({ I, k, v }: { I: typeof Clock; k: string; v: string }) {
  return <div className="flex items-center gap-2.5 text-[13.5px]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={14} /></span><span className="text-text-2">{k}</span><span className="ml-auto font-medium">{v}</span></div>;
}

function VideoTile({ title, dur, v, src, className }: { title: string; dur: string; v: EvidenceVariant; src?: string | null; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <EvidenceFrame variant={v} src={src} id="" room={title} time={dur} tone="pass" ratio="16 / 10" dense />
      <span className="absolute left-1/2 top-[42%] grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink"><Play size={16} className="ml-0.5 fill-ink" /></span>
      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white"><Video size={10} /> {dur}</span>
    </div>
  );
}

function HomeReport({ approved, setApproved }: { approved: boolean; setApproved: (v: boolean) => void }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card bg-white p-6 shadow-card sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[13px] text-text-2">Inspection report · RPT-2026-0412</div>
              <h2 className="mt-1 text-[26px] font-medium tracking-[-0.03em]">Ancestral Apartment</h2>
              <div className="mt-1 flex items-center gap-1.5 text-[14px] text-text-2"><MapPin size={14} /> C-14 Indiranagar, Bengaluru · 2 BHK</div>
            </div>
            <HealthRing score={84} size={96} stroke={8} label="Health" delay={0.3} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[["39", "Pass", "text-pass"], ["2", "Attention", "text-warn"], ["1", "Fail", "text-fail"]].map(([n, l, c]) => <div key={l} className="rounded-[12px] bg-paper px-3 py-3"><div className={cn("text-[24px] font-medium leading-none tracking-[-0.03em]", c)}>{n}</div><div className="mt-1 text-[12px] text-text-2">{l}</div></div>)}
          </div>
          <div className="mt-5 grid gap-2.5 border-t border-line pt-5 sm:grid-cols-2">
            <Meta I={BadgeCheck} k="Inspector" v="Ravi K. · police-verified" />
            <Meta I={KeyRound} k="Entry confirmed" v="13:02 · by Priya S." />
            <Meta I={Clock} k="On-site" v="13:02 → 14:11 (1h 09m)" />
            <Meta I={MapPin} k="GPS" v="26.8524° N, 75.8072° E" />
            <Meta I={Video} k="Videos" v="10 of 10 slots · all filled" />
            <Meta I={Check} k="Report delivered" v="14:49 · 38 min after exit" />
          </div>
        </div>
        <div className="card bg-ink p-6 text-white sm:p-7">
          <div className="flex items-center justify-between"><span className="text-[14px] font-medium">Exit walkthrough</span><span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px]">1:12 · 14:10</span></div>
          <p className="mt-1 text-[13px] text-white/65">Every room, wardrobes closed, gas off, main door locked — filmed before leaving.</p>
          <VideoTile title="Whole home" dur="1:12" v="living" className="mt-4" />
          <div className="mt-4 flex items-center justify-between rounded-[12px] bg-white/[0.07] px-4 py-3 text-[13px]"><span className="text-white/75">Something wrong with this visit?</span><span className="font-medium">Tap to report →</span></div>
        </div>
      </div>

      {/* flagged issue */}
      <div className="card mt-4 bg-white p-6 shadow-card sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-fail-soft text-fail"><Flag size={14} /></span><span className="text-[16px] font-medium">1 issue needs your decision</span></div><span className="chip chip-fail">Fail · Water leakage</span></div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="grid grid-cols-2 gap-2">
              <EvidenceFrame variant="bathroom" src={SHOT.bathLeak} id="0412" room="Bathroom 1" time="13:41" box={BOX.bathLeak} boxLabel="Leak" />
              <VideoTile title="Bathroom 1 · leak" dur="0:22" v="bathroom" src={SHOT.bathLeakClose} />
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-text-2">Slow drip from the trap joint under the basin — water is pooling on the floor and staining the tiles. Recommend replacing the trap and sealing. — Ravi K., 13:41</p>
          </div>
          <div className="rounded-[14px] bg-paper p-5">
            <div className="text-[13px] font-medium text-text-2">Quote from a verified pro · rate card</div>
            <div className="mt-2 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-[13px] font-medium text-white">SM</span><div><div className="flex items-center gap-1 text-[14.5px] font-medium">Suresh M. <BadgeCheck size={14} className="text-accent" /></div><div className="text-[12.5px] text-text-2">Plumbing · verified</div></div></div>
            <div className="mt-4 space-y-1.5 text-[14px]">
              <div className="flex justify-between"><span className="text-text-2">Replace P-trap + reseal (labour)</span><span>₹1,800</span></div>
              <div className="flex justify-between"><span className="text-text-2">Parts (trap, sealant)</span><span>₹1,200</span></div>
              <div className="flex justify-between"><span className="text-text-2">Still Yours fee · 15%</span><span>₹450</span></div>
              <div className="flex justify-between border-t border-line pt-2 font-medium"><span>You approve</span><span>₹3,450</span></div>
            </div>
            <p className="mt-2 text-[12px] text-text-2">Work happens during a scheduled visit with your inspector present. After-photos land in this report.</p>
            {!approved ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => setApproved(true)} className="btn btn-accent h-11 px-3 text-[13.5px]"><Check size={14} /> Approve ₹3,450</button>
                <button className="btn btn-white h-11 px-3 text-[13.5px]"><X size={14} /> Decline</button>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between rounded-[10px] bg-pass-soft px-3.5 py-3 text-[13.5px] font-medium text-[#157a44]"><span className="flex items-center gap-2"><Check size={14} /> Approved ₹3,300 · written to audit log</span><button onClick={() => setApproved(false)} className="text-[12px] text-text-2">undo</button></div>
            )}
          </div>
        </div>
      </div>

      {/* rooms */}
      <div className="swipe mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <div key={r.name} className="card bg-white p-4 shadow-card">
            <VideoTile title={r.name} dur={r.dur} v={r.v} src={r.src} />
            <div className="mt-3 flex items-center justify-between"><span className="text-[15px] font-medium">{r.name}</span><span className="inline-flex items-center gap-1 text-[11.5px] text-text-2"><Video size={11} /> video ✓</span></div>
            <ul className="mt-2 divide-y divide-line">
              {r.items.map((it) => <li key={it.t} className="flex items-center justify-between py-2 text-[13.5px]"><span>{it.t}</span><span className={chip(it.s)}>{label(it.s)}</span></li>)}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

function PlotReport() {
  const corners: [string, string, string, string | null][] = [
    ["NE corner", "0:18", "Marker intact", SHOT.plotNE], ["SE corner", "0:15", "Marker intact", SHOT.plotSE],
    ["SW corner", "0:21", "Fence post leaning", SHOT.plotSW], ["NW corner", "0:16", "Marker intact", SHOT.plotNW],
  ];
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card bg-white p-6 shadow-card sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[13px] text-text-2">Plot visit report · RPT-2026-0388</div>
              <h2 className="mt-1 text-[26px] font-medium tracking-[-0.03em]">Plot 22, Survey No. 118/2</h2>
              <div className="mt-1 flex items-center gap-1.5 text-[14px] text-text-2"><MapPin size={14} /> Yelahanka – Doddaballapur Rd, Bengaluru · 2,400 sq ft</div>
            </div>
            <div className="rounded-[14px] bg-pass-soft px-4 py-3 text-center"><div className="text-[13px] font-medium text-[#157a44]">No change</div><div className="text-[11px] text-text-2">vs. last visit</div></div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[["4/4", "Corners photographed", "text-pass"], ["0", "Encroachment", "text-pass"], ["1", "Attention", "text-warn"]].map(([n, l, c]) => <div key={l} className="rounded-[12px] bg-paper px-3 py-3"><div className={cn("text-[24px] font-medium leading-none tracking-[-0.03em]", c)}>{n}</div><div className="mt-1 text-[12px] text-text-2">{l}</div></div>)}
          </div>
          <div className="mt-5 grid gap-2.5 border-t border-line pt-5 sm:grid-cols-2">
            <Meta I={BadgeCheck} k="Inspector" v="Arun P. · police-verified" />
            <Meta I={Clock} k="On-site" v="10:20 → 10:58 (38 min)" />
            <Meta I={MapPin} k="Boundary walk" v="184 m · GPS track attached" />
            <Meta I={Video} k="Videos" v="5 of 5 · corners + walk" />
            <Meta I={Check} k="Report delivered" v="11:31 · 33 min after exit" />
            <Meta I={Flag} k="Notices / dumping" v="None" />
          </div>
        </div>
        <div className="card relative h-[360px] overflow-hidden bg-white shadow-card lg:h-auto">
          <MapCard className="h-full !rounded-none !shadow-none" />
          <div className="absolute left-4 top-4 rounded-[12px] bg-white/95 px-3.5 py-2.5 text-[13px] shadow-card backdrop-blur"><span className="font-medium">Boundary walk</span> · 4 corners GPS-tagged</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {corners.map(([c, d, r, src]) => (
          <div key={c} className="card bg-white p-4 shadow-card">
            {/* a plot corner is not a flat's balcony: a corner without a photo keeps the drawing */}
            <VideoTile title={c} dur={d} v="balcony" src={src} />
            <div className="mt-3 flex items-center justify-between"><span className="text-[15px] font-medium">{c}</span><span className={r.includes("leaning") ? "chip chip-warn" : "chip chip-pass"}>{r.includes("leaning") ? "Attention" : "Pass"}</span></div>
            <div className="t-small mt-1">{r} · 13.1187° N, 77.5945° E</div>
          </div>
        ))}
      </div>

      <div className="card mt-4 bg-white p-6 shadow-card sm:p-7">
        <div className="text-[16px] font-medium">Checked on this visit</div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[["Encroachment or occupation", "pass"], ["Unauthorised construction", "pass"], ["Boundary markers (4)", "pass"], ["Fence & gate", "attn"], ["Signboard present & legible", "pass"], ["Dumping / debris", "pass"], ["Notices, road or utility work", "pass"], ["Neighbour activity", "pass"]].map(([t, s]) => <li key={t} className="flex items-center justify-between rounded-[10px] bg-paper px-3.5 py-2.5 text-[14px]"><span>{t}</span><span className={chip(s as S)}>{label(s as S)}</span></li>)}
        </ul>
        <p className="mt-4 text-[14px] text-text-2">SW fence post leaning — not a boundary change. Recommend re-fixing before monsoon (₹900 quote available). Next visit in 3 months, or on request.</p>
      </div>
    </>
  );
}

export function SampleReport() {
  const [tab, setTab] = useState<"home" | "plot">("home");
  const [approved, setApproved] = useState(false);
  return (
    <section className="pt-[88px] md:pt-[100px]">
      <div className="wrap">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="t-label">Sample report</p><h1 className="t-1 mt-1">Sample inspection report</h1><p className="t-body mt-2 max-w-[56ch] text-text-2">Within the hour of every visit. Every room on video, every item with a verdict, every issue with a quote you approve. Tap around — it's interactive.</p></div>
          <div className="inline-flex rounded-[14px] bg-beige p-1" role="tablist">
            {([["home", "Home report", Home], ["plot", "Plot report", LandPlot]] as const).map(([k, l, I]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("inline-flex h-11 items-center gap-2 rounded-[11px] px-4 text-[15px] font-medium transition", tab === k ? "bg-white text-ink shadow-card" : "text-text-2 hover:text-ink")}><I size={16} /> {l}</button>
            ))}
          </div>
        </div>
        <div className="mt-8">{tab === "home" ? <HomeReport approved={approved} setApproved={setApproved} /> : <PlotReport />}</div>
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="t-body text-text-2">Want one of these for your place?</p>
          <Link href={START} className="btn btn-accent">{START_LABEL} <ArrowRight size={16} /></Link>
        </div>
      </div>
      <div className="h-16 md:h-24" />
    </section>
  );
}
