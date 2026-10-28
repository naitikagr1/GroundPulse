"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Bath, BedDouble, Building2, Car, ChefHat, Home, Info, KeyRound, LandPlot, MapPin, Minus, Plus, Sofa, Sun, Warehouse, X } from "lucide-react";
import { addProperty, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { PinPicker, type PinValue } from "@/components/app/PinPicker";
import { bhkLabel, bhkKeys, type BhkKey } from "@/lib/cleaning";
import { capFor, clampRooms, defaultsFor, extraRooms, ROOMS } from "@/lib/rooms";
import { inr } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import type { MapConfig } from "@/lib/ola";
import type { PropertyKind, RoomKey } from "@/lib/types";

const input = "h-12 w-full rounded-[12px] border border-line-2 bg-white px-4 text-[15px] text-ink outline-none transition placeholder:text-text-3 focus:border-accent focus:ring-4 focus:ring-accent/10";

const Field = ({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) => (
  <label className={cn("block", className)}>
    <span className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-[13px] font-medium text-text-2">{label}</span>
      {hint && <span className="text-[12px] text-text-3">{hint}</span>}
    </span>
    {children}
  </label>
);

const Group = ({ n, title, lede, children }: { n: number; title: string; lede: string; children: React.ReactNode }) => (
  <section className="card border border-line bg-white p-5 shadow-card sm:p-6">
    <div className="flex items-baseline gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-tint font-mono text-[11px] font-semibold text-accent">{n}</span>
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{title}</h2>
        <p className="t-small mt-0.5">{lede}</p>
      </div>
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

/* What a size can hold comes from lib/rooms — the same table the server
   clamps to — so the form cannot promise a 1 BHK five living rooms. */
const rows: { k: RoomKey; l: string; I: typeof BedDouble }[] = [
  { k: "bed", l: "Bedrooms", I: BedDouble },
  { k: "bath", l: "Bathrooms", I: Bath },
  { k: "living", l: "Living / dining", I: Sofa },
  { k: "kitchen", l: "Kitchen", I: ChefHat },
  { k: "balcony", l: "Balconies", I: Sun },
  { k: "study", l: "Study / store", I: Warehouse },
  { k: "terrace", l: "Terrace / garden", I: Sun },
  { k: "parking", l: "Parking (car)", I: Car },
];

const fromSize = defaultsFor;

/** The smallest bigger size that can hold one more of this room. */
const sizeFor = (from: BhkKey, k: RoomKey, n: number) => bhkKeys.find((b) => Number(b) > Number(from) && capFor(b, k) >= n);

const TYPES = ["Apartment", "Villa", "Independent house", "Builder floor"] as const;

export function PropertyForm({ welcome = false, map }: { welcome?: boolean; map: MapConfig }) {
  const [state, submit] = useActionState(addProperty, { ok: false } as FormState);
  const [kind, setKind] = useState<PropertyKind>("home");
  const [size, setSize] = useState<BhkKey>("2");
  const [rooms, setRooms] = useState<Record<RoomKey, number>>(fromSize("2"));
  const [pin, setPin] = useState<PinValue | null>(null);
  const [locality, setLocality] = useState("");
  const isPlot = kind === "plot";

  /* one more than this size holds: ask whether it is really the next size */
  const [nudge, setNudge] = useState<{ k: RoomKey; to: BhkKey } | null>(null);

  const pickSize = (s: BhkKey) => { setSize(s); setRooms(fromSize(s)); setNudge(null); };
  const bump = (k: RoomKey, d: number) => {
    const next = rooms[k] + d;
    if (d < 0) return setRooms((cur) => ({ ...cur, [k]: Math.max(ROOMS[k].min, next) }));
    if (next <= capFor(size, k)) return setRooms((cur) => ({ ...cur, [k]: next }));
    const to = sizeFor(size, k, next);
    if (to) setNudge({ k, to });
  };
  /* the bigger size's own layout, keeping anything already raised past it, plus the room that asked */
  const switchTo = (to: BhkKey, k: RoomKey) => {
    const base = fromSize(to);
    setSize(to);
    setRooms((cur) => clampRooms(to, { ...Object.fromEntries(rows.map((r) => [r.k, Math.max(base[r.k], cur[r.k])])), [k]: Math.max(base[k], cur[k] + 1) }));
    setNudge(null);
  };
  const total = rows.reduce((n, r) => n + rooms[r.k], 0);
  /* 4 BHK and up can grow; every room past the layout is priced per visit */
  const extras = extraRooms(size, rooms, "one-time");
  const extraPerVisit = extras.reduce((n, e) => n + e.perVisit, 0);

  return (
    <form action={submit} className="grid gap-4">
      {welcome && <input type="hidden" name="step" value="welcome" />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="size" value={size} />
      {rows.map((r) => <input key={r.k} type="hidden" name={`room_${r.k}`} value={isPlot ? 0 : rooms[r.k]} />)}

      <Group n={1} title="What are we looking after?" lede="A home gets the room-by-room checklist. A plot gets a boundary walk.">
        <div className="grid gap-2 sm:grid-cols-2">
          {([["home", "Home", Building2, "Apartment, villa, the family house"], ["plot", "Plot or land", LandPlot, "Boundary, encroachment, occupation"]] as const).map(([k, l, I, note]) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={cn("flex items-start gap-3 rounded-[14px] border p-4 text-left transition", kind === k ? "border-accent bg-accent-tint ring-2 ring-accent/15" : "border-line-2 hover:border-line-2 hover:bg-paper")}>
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", kind === k ? "bg-accent text-white" : "bg-beige text-text-2")}><I size={17} /></span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold">{l}</span>
                <span className="t-small block leading-snug">{note}</span>
              </span>
            </button>
          ))}
        </div>
      </Group>

      <Group n={2} title="Where is it?" lede="The address the inspector will stand in front of. Give it a name only you would use — that is what you will see in the app.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name it" hint="yours to recognise" className="sm:col-span-2">
            <input name="label" required placeholder={isPlot ? "Village plot" : "Ancestral apartment"} className={input} />
          </Field>
          <Field label="Full address" className="sm:col-span-2">
            <div className="flex items-center gap-2 rounded-[12px] border border-line-2 bg-white px-4 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
              <MapPin size={15} className="shrink-0 text-text-3" />
              <input name="address" required placeholder={isPlot ? "Survey 114/2, Chikkajala, Devanahalli" : "C-14, 100 Ft Road, Indiranagar"} className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-text-3" />
            </div>
          </Field>
          <Field label="Locality"><input name="locality" value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="Indiranagar" className={input} /></Field>
          <Field label="City" hint="Bengaluru only, for now"><input name="city" defaultValue="Bengaluru" className={input} /></Field>
          {/* not a <Field>: a label around it would steer every tap on the map into the search box */}
          <div className="sm:col-span-2">
            <span className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-text-2">The exact spot</span>
              <span className="rounded-full bg-beige px-2.5 py-0.5 text-[11.5px] font-semibold text-text-2">Optional</span>
            </span>
            {/* Said before the tools, not after them: a guessed pin is worse
                than none, because every visit is measured from it. */}
            <div className="mb-3 flex gap-2.5 rounded-[12px] bg-paper p-3.5">
              <Info size={15} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[13.5px] leading-snug text-text-2">
                <span className="font-semibold text-ink">Only if you know exactly where it is.</span>{" "}
                Not sure? Leave this empty — your first inspector marks the spot at the {isPlot ? "boundary" : "gate"}, and you confirm it.
                A guessed pin does more harm than none: every visit is measured from it.
              </p>
            </div>
            {/* Fill the locality from the map only while the owner has not typed one. */}
            <PinPicker value={pin} onChange={setPin} config={map} plot={isPlot} onPlace={(h) => { if (h.locality) setLocality((cur) => cur || h.locality); }} />
          </div>
        </div>
      </Group>

      {!isPlot && (
        <>
          <Group n={3} title="What kind, and how big?" lede="This sets your checklist and your price — nothing is added at the door.">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TYPES.map((t, i) => (
                <label key={t} className="cursor-pointer">
                  <input type="radio" name="type" value={t} defaultChecked={i === 0} className="peer sr-only" />
                  <span className="flex h-11 items-center justify-center rounded-[12px] border border-line-2 px-2 text-center text-[13px] font-medium text-text-2 transition peer-checked:border-accent peer-checked:bg-accent-tint peer-checked:text-accent-2">{t}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {bhkKeys.map((b) => (
                <button key={b} type="button" onClick={() => pickSize(b)}
                  className={cn("h-11 rounded-[12px] border text-[13.5px] font-semibold transition", size === b ? "border-accent bg-accent text-white" : "border-line-2 text-text-2 hover:bg-paper")}>
                  {bhkLabel[b]}
                </button>
              ))}
            </div>
          </Group>

          <Group n={4} title="The rooms we will walk" lede={`${total} spaces, plus the entrance and the exit walkthrough. Adjust anything that is not right.`}>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {rows.map(({ k, l, I }) => (
                <div key={k} className="flex items-center gap-3 rounded-[12px] border border-line px-3.5 py-2.5">
                  <I size={15} className="shrink-0 text-text-3" />
                  <span className="min-w-0 flex-1 truncate text-[14px]">{l}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => bump(k, -1)} aria-label={`One fewer ${l}`} className="grid h-8 w-8 place-items-center rounded-full border border-line-2 text-text-2 transition hover:border-ink hover:text-ink disabled:opacity-30" disabled={rooms[k] <= ROOMS[k].min}><Minus size={13} /></button>
                    <span className="w-6 text-center font-mono text-[14px] tabular-nums">{rooms[k]}</span>
                    <button type="button" onClick={() => bump(k, 1)} aria-label={`One more ${l}`} className="grid h-8 w-8 place-items-center rounded-full border border-line-2 text-text-2 transition hover:border-ink hover:text-ink disabled:opacity-30"
                      disabled={rooms[k] >= capFor(size, k) && !sizeFor(size, k, rooms[k] + 1)}><Plus size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
            {Number(size) >= 4 && (
              <p className="mt-3 rounded-[12px] bg-paper px-3.5 py-2.5 text-[13px] leading-snug text-text-2">
                {extras.length
                  ? <>Past a {bhkLabel[size]} layout: {extras.map((e) => `${e.n} × ${e.one.toLowerCase()} at ${inr(e.rate)}`).join(" · ")} — <b className="text-ink">+{inr(extraPerVisit)} on each inspection</b>.</>
                  : <>A {bhkLabel[size]} layout is included. Each room you add past it is charged per inspection — a bedroom {inr(ROOMS.bed.rate)}, a bathroom {inr(ROOMS.bath.rate)}.</>}
              </p>
            )}
          </Group>
        </>
      )}

      {nudge && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-ink/40 p-4 backdrop-blur-[2px] sm:place-items-center" onClick={() => setNudge(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="nudge-title" onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-[20px] bg-white p-5 shadow-float">
            <div className="flex items-start justify-between gap-3">
              <h3 id="nudge-title" className="text-[17px] font-semibold tracking-[-0.015em]">Is it a {bhkLabel[nudge.to]}?</h3>
              <button type="button" onClick={() => setNudge(null)} aria-label="Close" className="-m-1 p-1 text-text-3 hover:text-ink"><X size={18} /></button>
            </div>
            <p className="t-small mt-1.5 leading-relaxed">
              A {bhkLabel[size]} has at most {capFor(size, nudge.k)} {capFor(size, nudge.k) === 1 ? ROOMS[nudge.k].one.toLowerCase() : ROOMS[nudge.k].label.toLowerCase()}. Switch to {bhkLabel[nudge.to]} and we will set the checklist — and the price — for the home you actually have.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => switchTo(nudge.to, nudge.k)} className="btn btn-accent btn-sm">Switch to {bhkLabel[nudge.to]}</button>
              <button type="button" onClick={() => setNudge(null)} className="btn btn-white btn-sm">Keep {bhkLabel[size]}</button>
            </div>
          </div>
        </div>
      )}

      <Group n={isPlot ? 3 : 5} title="How does the inspector get in?" lede="The more of this we have, the less anybody has to call you about it.">
        <div className="grid gap-4">
          <Field label="Anything they should know" hint="gate timings, lift, dogs, which key">
            <textarea name="accessNote" rows={3} placeholder={isPlot ? "Mud road past the borewell. Red survey stone at the north-east corner is the reference." : "Lift to 3rd floor. Security needs the OTP before they let anyone up — gate closes 21:00."}
              className="w-full rounded-[12px] border border-line-2 bg-white px-4 py-3 text-[15px] leading-relaxed outline-none transition placeholder:text-text-3 focus:border-accent focus:ring-4 focus:ring-accent/10" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Who holds a key?" hint="optional">
              <div className="flex items-center gap-2 rounded-[12px] border border-line-2 bg-white px-4 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                <KeyRound size={15} className="shrink-0 text-text-3" />
                <input name="keyHolderName" placeholder="Lakshmi (neighbour, C-13)" className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-text-3" />
              </div>
            </Field>
            <Field label="Their number" hint="optional"><input name="keyHolderPhone" inputMode="tel" placeholder="+91 98450 11223" className={input} /></Field>
          </div>
        </div>
      </Group>

      {state.error && <p className="rounded-[12px] bg-fail-soft px-4 py-3 text-[13.5px] text-[#b03434]">{state.error}</p>}

      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-10 lg:static">
        <SubmitButton className="w-full" icon={<ArrowRight size={16} />} pendingLabel="Saving…">
          {welcome ? "Save and pick a visit" : "Save property"}
        </SubmitButton>
      </div>
      <p className="t-small text-center">
        <Home size={12} className="mr-1 inline -translate-y-px" />
        Nothing is booked yet — this just tells us what the place is.
      </p>
    </form>
  );
}
