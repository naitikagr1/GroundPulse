import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, Check, Clock, Flag, KeyRound, Lock, MapPin, Video,
} from "lucide-react";
import { PayButton } from "@/components/app/PayButton";
import { requireOwner } from "@/lib/auth";
import { reportView } from "@/lib/queries";
import { HealthRing } from "@/components/ui/HealthRing";
import { Reveal } from "@/components/ui/Reveal";
import { Panel, PanelHead, Stat, money } from "@/components/app/ui";
import { IssueCard } from "@/components/app/IssueCard";
import { PhotoStrip } from "@/components/app/PhotoStrip";
import { VideoClip } from "@/components/app/VideoClip";
import { MarkRead } from "@/components/app/MarkRead";
import { HEALTH } from "@/lib/checklist";
import { fmtDate, fmtDateTime, fmtDayDate, fmtTime } from "@/lib/format";
import Image from "next/image";
import { bhkLabel } from "@/lib/cleaning";
import { checkInWords } from "@/lib/geo";
import { cn } from "@/lib/cn";
import type { ItemState } from "@/lib/types";

const chipOf = (s: ItemState) => (s === "pass" ? "chip chip-pass" : s === "fail" ? "chip chip-fail" : "chip chip-warn");
const labelOf = (s: ItemState) => (s === "pass" ? "Pass" : s === "fail" ? "Fail" : "Attention");

export default async function Page({ params }: PageProps<"/app/reports/[id]">) {
  const user = await requireOwner();
  const { id } = await params;
  const view = await reportView(user.id, id);
  if (!view) notFound();

  const { report: r, property: p, visit: v, inspector, issues, subscription, invoicesByIssue, balance } = view;
  const card = (i: (typeof issues)[number]) => (
    <IssueCard key={i.id} issue={i} founding={v.founding === true} sub={subscription} invoice={invoicesByIssue[i.id]} tz={user.tz} />
  );
  const open = issues.filter((i) => i.decision === "pending");
  const settled = issues.filter((i) => i.decision !== "pending");
  const total = r.counts.pass + r.counts.attn + r.counts.fail;
  /* Say exactly how much of the evidence carries a location — a photo the
     phone could not place is still a photo, but not a GPS-stamped one. */
  const photos = r.rooms.flatMap((room) => room.items.flatMap((i) => i.photos ?? []));
  const located = photos.filter((ph) => ph.lat !== null && ph.lng !== null).length;

  return (
    <>
      {!balance && <MarkRead id={r.id} already={!!r.readAt} />}
      <Link href={`/app/properties/${p.id}` as Route} className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2 transition hover:text-ink"><ArrowLeft size={14} /> {p.label}</Link>

      {/* ── the headline ───────────────────────────────────── */}
      <Reveal>
        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <Panel className="p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="grow basis-[15rem]">
                <div className="t-small font-mono">{r.ref}</div>
                <h1 className="serif mt-1 text-[clamp(1.7rem,3vw,2.2rem)] leading-[1.06] tracking-[-0.035em]">{p.label}</h1>
                <div className="t-small mt-1.5 flex items-center gap-1.5"><MapPin size={13} /> {p.address} · {p.kind === "plot" ? "Plot" : bhkLabel[p.size]}</div>
              </div>
              <HealthRing score={r.score} size={96} stroke={8} label="Health" delay={0.25} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <Stat n={r.counts.pass} l="Pass" tone="pass" />
              <Stat n={r.counts.attn} l="Attention" tone="warn" />
              <Stat n={r.counts.fail} l="Fail" tone="fail" />
            </div>
            <p className="t-small mt-2.5">
              {total} items checked. The score starts at 100 — an attention costs {HEALTH.attn}, a fail costs {HEALTH.fail}. Nothing is weighted in secret.
            </p>

            <div className="mt-5 grid gap-2.5 border-t border-line pt-5 sm:grid-cols-2">
              <Meta I={BadgeCheck} k="Inspector" v={inspector ? `${inspector.name} · verified` : "—"} />
              <Meta I={KeyRound} k="Entered with OTP" v={`${r.otpAt} · shared by you`} />
              <Meta I={Clock} k="On site" v={r.onSite} />
              <Meta I={MapPin} k="GPS" v={r.gps} />
              {r.videos && <Meta I={Video} k="Video" v={r.videos} />}
              <Meta I={Check} k="Delivered" v={fmtDateTime(r.publishedAt)} />
            </div>
          </Panel>

          {/* what the inspector actually said — or, while the balance is
              owed, what paying it opens */}
          {balance ? (
            <div className="on-dark card flex flex-col bg-ink p-6 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white"><Lock size={18} /></span>
              <h2 className="serif mt-4 text-[24px] leading-[1.1] tracking-[-0.03em] text-white">Your full report is ready.</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-white/75">
                Pay the remaining {money(balance.amountInr)} to open it: every room&apos;s photos and video, the inspector&apos;s own words,
                {issues.length ? ` and the ${issues.length} ${issues.length === 1 ? "thing" : "things"} flagged — each with its repair price.` : " and the full checklist."}
              </p>
              <PayButton purpose="invoice" refId={balance.id} amount={balance.amountInr} label={`Pay ${money(balance.amountInr)} and open the report`} className="mt-5" />
              <p className="mt-3 text-[12px] leading-snug text-white/50">{balance.ref} · what you paid when booking is already counted.</p>
            </div>
          ) : (
          <div className="grid gap-4">
            <div className="on-dark card bg-ink p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-white">In the inspector's words</span>
                <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] text-white/80">{fmtDate(v.scheduledFor, { year: true })}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80">{r.summary}</p>
              {inspector && (
                <div className="mt-4 flex items-center gap-2.5 border-t border-white/12 pt-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 text-[12px] font-semibold text-white">{inspector.initials}</span>
                  <div><div className="text-[13.5px] font-medium text-white">{inspector.name}</div><div className="text-[12px] text-white/50">{inspector.bg}</div></div>
                </div>
              )}
            </div>

            <Panel className="p-5">
              <Link href="/app/help" className="t-small flex items-center justify-between rounded-[12px] bg-paper px-4 py-3 transition hover:bg-beige">
                <span>Something wrong with this visit?</span><span className="font-medium text-accent">Tell us →</span>
              </Link>
            </Panel>
          </div>
          )}
        </div>
      </Reveal>

      {balance ? null : <>

      {/* ── decisions ──────────────────────────────────────── */}
      {open.length > 0 && (
        <Reveal delay={0.05} className="mt-6">
          <div className="flex items-center gap-2.5 pb-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-fail-soft text-fail"><Flag size={15} /></span>
            <h2 className="serif text-[22px] tracking-[-0.03em]">{open.length} {open.length === 1 ? "issue needs" : "issues need"} your decision</h2>
          </div>
          <div className="grid gap-4">{open.map(card)}</div>
        </Reveal>
      )}

      {settled.length > 0 && (
        <Reveal delay={0.05} className="mt-6">
          <h2 className="serif pb-3 text-[22px] tracking-[-0.03em]">Already decided</h2>
          <div className="grid gap-4">{settled.map(card)}</div>
        </Reveal>
      )}

      {/* ── room by room ───────────────────────────────────── */}
      <Reveal delay={0.05} className="mt-6">
        <div className="flex items-end justify-between pb-3">
          <h2 className="serif text-[22px] tracking-[-0.03em]">Room by room</h2>
          <span className="t-small">{r.rooms.length} areas · {total} items</span>
        </div>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {r.rooms.map((room, n) => {
          const worst: ItemState = room.items.some((i) => i.s === "fail") ? "fail" : room.items.some((i) => i.s === "attn") ? "attn" : "pass";
          /* every photograph from the room, OK items included — a meter
             reading or a closed gas valve is proof too */
          const shots = room.items.flatMap((i) => i.photos ?? []);
          return (
            <Reveal key={room.name} delay={0.02 * n}>
              <Panel className="h-full p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-medium">{room.name}</span>
                  <span className={cn("shrink-0", chipOf(worst))}>{labelOf(worst)}</span>
                </div>
                {/* the clean, from the same spot — the owner judges the work, not a tick */}
                {(room.before || room.after) && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {([["Before", room.before], ["After", room.after]] as const).map(([k, ph]) => (
                      <figure key={k}>
                        {ph
                          ? <Image src={ph.thumb} alt={`${room.name}, ${k.toLowerCase()} the clean`} width={320} height={240} unoptimized className="aspect-[4/3] w-full rounded-[10px] object-cover" />
                          : <span className="grid aspect-[4/3] place-items-center rounded-[10px] bg-paper text-[12px] text-text-3">No photo</span>}
                        <figcaption className="t-small mt-1">{k}{ph ? ` · ${fmtTime(ph.at)}` : ""}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
                {room.video && <VideoClip v={room.video} label={`${room.name} walkthrough`} className="mt-3" />}
                {shots.length > 0 && <PhotoStrip photos={shots} label={room.name} size={64} className="mt-3" />}
                <ul className="mt-2 divide-y divide-line">
                  {room.items.map((it) => (
                    <li key={it.t} className="py-2">
                      <div className="flex items-center justify-between gap-3 text-[13.5px]">
                        <span className="min-w-0 truncate">{it.t}</span>
                        <span className={cn("shrink-0", chipOf(it.s))}>{labelOf(it.s)}</span>
                      </div>
                      {it.note && <p className="mt-1 text-[12.5px] leading-snug text-text-2">{it.note}</p>}
                    </li>
                  ))}
                </ul>
              </Panel>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="mt-6">
        <Panel>
          <PanelHead title="Where this report came from" meta="The chain nobody can edit after the fact" />
          <ol className={cn("grid gap-px bg-line", v.crewStartedAt ? "lg:grid-cols-5" : "sm:grid-cols-4")}>
            {[
              ["OTP shared", `${r.otpAt} — by you`],
              ["Inspector entered", `${r.onSite.split(" → ")[0]}${v.checkIn ? ` · ${checkInWords(v.checkIn).short}` : ""}`],
              ...(v.crewStartedAt ? [["Cleaning crew started", `${fmtTime(v.crewStartedAt)} · every room photographed first`]] : []),
              ["Checklist submitted", r.onSite.split(" → ")[1] ?? "—"],
              ["Report delivered", fmtDateTime(r.publishedAt)],
            ].map(([k, val]) => (
              <li key={k} className="bg-white px-5 py-4">
                <div className="t-label">{k}</div>
                <div className="mt-1 text-[13.5px] font-medium tabular-nums">{val}</div>
              </li>
            ))}
          </ol>
          <p className="t-small border-t border-line px-5 py-3.5">
            Visit {v.ref} · {fmtDayDate(v.scheduledFor)} · {photos.length ? `${located} of ${photos.length} photographs GPS-stamped, every one time-stamped` : "every photograph time-stamped"}, stored privately, visible only to you.
          </p>
        </Panel>
      </Reveal>
      </>}
    </>
  );
}

function Meta({ I, k, v }: { I: typeof Clock; k: string; v: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[13.5px]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><I size={14} /></span>
      <span className="text-text-2">{k}</span>
      <span className="ml-auto truncate font-medium tabular-nums">{v}</span>
    </div>
  );
}

