"use client";

import { BadgeCheck, Bell, Camera, Check, ChevronRight, Flag, MapPin, X } from "lucide-react";
import { EvidenceFrame } from "@/components/ui/EvidenceFrame";
import { HealthRing } from "@/components/ui/HealthRing";
import { cn } from "@/lib/cn";
import { BOX, SHOT } from "@/lib/photos";

/* Small, white product mocks reused across pages. */

export const Card = ({ title, meta, children, className }: { title: string; meta?: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("card shadow-card overflow-hidden bg-white", className)}>
    <div className="flex items-center justify-between border-b border-line px-2.5 py-3 sm:px-4">
      <span className="text-[13.5px] font-semibold">{title}</span>{meta && <span className="text-[12px] text-text-3">{meta}</span>}
    </div>
    <div className="p-2.5 sm:p-4">{children}</div>
  </div>
);
const Lbl = ({ c }: { c: string }) => <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">{c}</div>;

export function RegisterMock() {
  return (
    <Card title="Add property" meta="4:12">
      <Lbl c="Address" />
      <div className="flex h-10 items-center gap-2 rounded-[10px] border border-line-2 px-3 text-[13px]"><MapPin size={13} className="text-text-3" /> C-14 Indiranagar, Bengaluru</div>
      <div className="mt-3"><Lbl c="Type" />
        <div className="grid grid-cols-3 gap-1.5">{["Apartment", "Villa", "House"].map((t, i) => <span key={t} className={cn("flex h-9 items-center justify-center rounded-[10px] border text-[12px] font-medium", i === 0 ? "border-accent bg-accent-soft text-accent-2" : "border-line-2 text-text-2")}>{t}</span>)}</div>
      </div>
      <div className="mt-3"><Lbl c="Cover photo" /><EvidenceFrame variant="entrance" src="/photos/exterior.jpg" id="COVER" room="Cover photo" time="uploaded" tone="pass" ratio="16 / 6" /></div>
      <span className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-accent text-[13px] font-semibold text-white">Save property <ChevronRight size={14} /></span>
    </Card>
  );
}

export function ScheduleMock() {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  return (
    <Card title="Schedule inspection" meta="October">
      <div className="grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="pb-1 text-[10px] font-semibold text-text-3">{d}</span>)}
        {days.map((d) => <span key={d} className={cn("grid h-7 place-items-center rounded-[7px] text-[12px] tabular-nums", d < 9 ? "text-text-3 line-through" : "text-ink", d === 14 && "bg-accent font-semibold text-white")}>{d}</span>)}
      </div>
      <div className="mt-3"><Lbl c="Recurrence" />
        <div className="grid grid-cols-4 gap-1.5">{["None", "Weekly", "Monthly", "Quarterly"].map((t, i) => <span key={t} className={cn("flex h-9 items-center justify-center rounded-[10px] border text-[11.5px] font-medium", i === 3 ? "border-accent bg-accent-soft text-accent-2" : "border-line-2 text-text-2")}>{t}</span>)}</div>
      </div>
      <div className="mt-3 flex items-center gap-2.5 rounded-[10px] bg-pass-soft px-3 py-2.5 text-[12.5px] font-medium text-[#157a44]"><span className="grid h-5 w-5 place-items-center rounded-full bg-pass text-white"><Check size={11} strokeWidth={3} /></span> Scheduled — inspector assigned shortly.</div>
    </Card>
  );
}

const rows: { room: string; item: string; s: 0 | 1 | 2; media?: string }[] = [
  { room: "Kitchen", item: "Sink & plumbing", s: 0, media: "1 photo" },
  { room: "Bathroom", item: "Sink & plumbing", s: 1, media: "2 photos · 1 video" },
  { room: "Bedroom", item: "Window locks", s: 2, media: "1 photo" },
  { room: "Balcony", item: "Railing & drainage", s: 0 },
];
export const Seg = ({ s }: { s: 0 | 1 | 2 }) => (
  <div className="grid grid-cols-3 overflow-hidden rounded-[8px] border border-line-2 text-[10.5px] font-semibold">
    {(["Pass", "Fail", "Attn"] as const).map((l, i) => (
      <span key={l} className={cn("flex h-7 items-center justify-center gap-1", i !== 0 && "border-l border-line-2", s === i && i === 0 && "bg-pass text-white", s === i && i === 1 && "bg-fail text-white", s === i && i === 2 && "bg-warn text-white", s !== i && "text-text-3")}>
        {s === i && (i === 0 ? <Check size={10} strokeWidth={3} /> : i === 1 ? <X size={10} strokeWidth={3} /> : <Flag size={10} strokeWidth={3} />)}{l}
      </span>
    ))}
  </div>
);
export function InspectMock() {
  return (
    <Card title="Checklist · on-site" meta="00:37:12">
      <div className="divide-y divide-line">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0"><div className="truncate text-[12.5px]"><span className="text-text-3">{r.room} · </span>{r.item}</div>{r.media && <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-text-3"><Camera size={9} /> {r.media}</div>}</div>
            <div className="w-[104px] shrink-0 sm:w-[136px]"><Seg s={r.s} /></div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between"><span className="t-small">42 items · 39 done</span><span className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-fail px-3.5 text-[12px] font-semibold text-white"><Flag size={12} /> Flag issue</span></div>
    </Card>
  );
}

export function ReportMock() {
  return (
    <Card title="Inspection report" meta="38 min after visit">
      <div className="flex items-center gap-4">
        <HealthRing score={84} size={84} stroke={7} delay={0.3} />
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          {[["39", "Pass", "text-pass"], ["2", "Attn", "text-warn"], ["1", "Fail", "text-fail"]].map(([n, l, c]) => <div key={l} className="rounded-[10px] bg-paper px-2.5 py-2"><div className={cn("text-[1.3rem] font-bold leading-none tracking-[-0.03em]", c)}>{n}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3">{l}</div></div>)}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <EvidenceFrame variant="kitchen" dense tone="pass" id="0398" room="Kitchen" time="13:51" />
        <EvidenceFrame variant="bathroom" src={SHOT.bathLeak} dense id="0412" room="Bath" time="14:02" box={BOX.bathLeak} boxLabel="Leak" />
        <EvidenceFrame variant="bedroom" src={SHOT.bedroom} dense tone="attn" id="0406" room="Bed" time="13:57" box={BOX.bedroomLock} boxLabel="Lock" />
        <EvidenceFrame variant="balcony" dense tone="pass" id="0421" room="Balcony" time="14:11" />
      </div>
      <div className="mt-3 flex items-center justify-between rounded-[10px] border border-line px-3 py-2 text-[12px]"><span className="inline-flex items-center gap-1.5 text-text-2"><Bell size={11} /> Email + in-app notification sent</span><span className="chip chip-pass">Ready</span></div>
    </Card>
  );
}

export function DecideMock() {
  return (
    <Card title="Issue · Water leakage" meta="#0917">
      <div className="grid grid-cols-2 gap-1.5">
        <EvidenceFrame variant="bathroom" src={SHOT.bathLeak} dense id="0412" room="Bathroom" time="14:02" box={BOX.bathLeak} boxLabel="Leak" />
        <EvidenceFrame variant="bathroom" src={SHOT.bathLeakClose} dense id="0413" room="Close-up" time="14:03" box={BOX.bathLeakClose} boxLabel="Moisture" />
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-text-2">Slow drip from the trap joint under the basin — water is pooling on the floor and staining the tiles. Recommend replacing the trap and sealing.</p>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <span className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-accent text-[12.5px] font-semibold text-white"><Check size={13} /> Approve repair</span>
        <span className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-line-2 text-[12.5px] font-semibold"><X size={13} /> Decline</span>
      </div>
    </Card>
  );
}

const stages = ["Requested", "Assigned", "In progress", "Completed"];
export function ResolveMock({ stage = 3 }: { stage?: number }) {
  return (
    <Card title="Repair · #0917" meta="live">
      <ol className="grid grid-cols-4 gap-1">
        {stages.map((s, i) => <li key={s}><div className={cn("h-1.5 rounded-full", i <= stage ? "bg-pass" : "bg-line")} /><div className={cn("mt-1.5 text-[9px] font-semibold uppercase tracking-[0.04em]", i <= stage ? "text-ink" : "text-text-3")}>{s}</div></li>)}
      </ol>
      <div className="mt-3 flex items-center gap-3 rounded-[10px] bg-paper p-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-bold text-white">SM</span>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-1 text-[13px] font-semibold">Suresh M. <BadgeCheck size={13} className="text-accent" /></div><div className="text-[11.5px] text-text-3">Plumbing · Indiranagar · verified</div></div>
        <span className="chip chip-pass">Done</span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_1.5fr] gap-1.5">
        <EvidenceFrame variant="bathroom" src={SHOT.bathFixed} dense id="AFTER_01" room="Fixed" time="12:48" tone="pass" box={BOX.bathFixed} boxLabel="Fixed" />
        <div className="rounded-[10px] border border-line p-2.5 text-[11.5px] leading-relaxed text-text-2"><span className="text-[9.5px] font-semibold uppercase tracking-[0.06em] text-text-3">Completion note</span><br />Replaced P-trap, resealed joint, dried cabinet. Tested 20 min — no drip.</div>
      </div>
    </Card>
  );
}

/* Inspector home */
export function InspectorJobsMock() {
  const jobs = [
    { t: "Today · 13:30", a: "C-14 Indiranagar, Bengaluru", s: "In progress", c: "chip-accent" },
    { t: "Today · 16:00", a: "B-7 Koramangala, Bengaluru", s: "Assigned", c: "" },
    { t: "Tomorrow · 10:00", a: "Plot 22, Devanahalli", s: "Assigned", c: "" },
  ];
  return (
    <Card title="Assigned inspections" meta="Ravi K. · verified">
      <ul className="divide-y divide-line">
        {jobs.map((j) => (
          <li key={j.a} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0"><div className="text-[11.5px] font-semibold text-text-3">{j.t}</div><div className="truncate text-[13px] font-medium">{j.a}</div></div>
            <span className={cn("chip", j.c)}>{j.s}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* Provider jobs */
export function ProviderJobsMock() {
  return (
    <Card title="My jobs" meta="Suresh M. · Plumbing">
      <div className="rounded-[12px] border border-line p-3">
        <div className="flex items-center justify-between"><span className="text-[13px] font-semibold">Water leakage · Bathroom</span><span className="chip chip-accent">In progress</span></div>
        <div className="t-small mt-1">C-14 Indiranagar · Owner approved 16:22</div>
        <div className="mt-3"><Lbl c="Completion note (required)" /><div className="min-h-[52px] rounded-[10px] border border-line-2 px-3 py-2 text-[12.5px] text-text-2">Replaced P-trap, resealed joint, dried cabinet. Tested 20 min — no drip.</div></div>
        <div className="mt-2 flex items-center gap-2"><span className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line-2 px-2.5 text-[12px] font-medium"><Camera size={12} /> 1 after-photo</span></div>
        <span className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-accent text-[13px] font-semibold text-white"><Check size={14} /> Mark complete</span>
      </div>
    </Card>
  );
}

/* Admin dashboard */
export function AdminMock() {
  const counts = [["128", "Active properties"], ["14", "Pending inspections"], ["9", "Open issues"], ["4", "Repairs in progress"]];
  const queue = [{ n: "Aisha P.", r: "Inspector · Bengaluru", ok: true }, { n: "Karan V.", r: "Electrician · Bengaluru", ok: true }, { n: "R. Meena", r: "Plumber · Bengaluru", ok: false }];
  return (
    <Card title="Admin dashboard" meta="example data">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {counts.map(([n, l]) => <div key={l} className="rounded-[10px] bg-paper px-3 py-2.5"><div className="text-[1.5rem] font-bold leading-none tracking-[-0.04em]">{n}</div><div className="mt-1 text-[10.5px] font-semibold text-text-3">{l}</div></div>)}
      </div>
      <div className="mt-3"><Lbl c="Verification queue" />
        <ul className="divide-y divide-line">
          {queue.map((q) => (
            <li key={q.n} className="flex items-center justify-between py-2">
              <div><div className="text-[13px] font-medium">{q.n}</div><div className="t-small">{q.r}</div></div>
              <span className={cn("h-8 rounded-[8px] px-3 text-[12px] font-semibold leading-8", q.ok ? "bg-ink text-white" : "bg-beige text-text-2")}>{q.ok ? "Verify" : "Pending docs"}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/* Owner dashboard */
export function OwnerDashMock() {
  const props = [
    { n: "Ancestral Apartment", a: "Indiranagar", s: 84, open: 1 },
    { n: "Garden Villa", a: "Whitefield", s: 62, open: 2 },
    { n: "Unit 3 · HSR Layout", a: "Bengaluru", s: 91, open: 0 },
  ];
  return (
    <Card title="My properties" meta="Priya S.">
      <div className="grid grid-cols-1 gap-2">
        {props.map((p, i) => (
          <div key={p.n} className="flex items-center gap-3 rounded-[12px] border border-line p-2.5">
            <HealthRing score={p.s} size={46} stroke={4.5} delay={0.3 + i * 0.1} />
            <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{p.n}</div><div className="t-small">{p.a}</div></div>
            {p.open ? <span className={cn("chip", p.open > 1 ? "chip-warn" : "chip-fail")}>{p.open} open</span> : <span className="chip chip-pass">Clear</span>}
          </div>
        ))}
        <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-line-2 text-[13px] font-semibold text-text-2">+ Add property</span>
      </div>
    </Card>
  );
}
