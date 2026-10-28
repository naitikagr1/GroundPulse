"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Car, Check, ClipboardCheck, Gift, Info, LandPlot, MapPin, MapPinOff, Minus, Plus, Sparkles, Video, Wrench } from "lucide-react";
import { bookVisit, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { DayPicker, firstBookable } from "@/components/app/DayPicker";
import { advanceOf, quote, inr, SLOTS } from "@/lib/quote";
import { plans } from "@/lib/pricing";
import { tiers, bhkLabel } from "@/lib/cleaning";
import { blockedBecause, eligible, hasFreeVisit, qualifies, terms, LIMIT } from "@/lib/offer";
import { inServiceArea, HOME_CITY } from "@/lib/city";
import { extraRooms } from "@/lib/rooms";
import { cn } from "@/lib/cn";
import type { Property, User, VisitKind } from "@/lib/types";

/** What a property's plan still has to give this year. */
export type PlanInfo = { name: string; planId: string; total: number; left: { visits: number; cleans: number; services: number } };

const Group = ({ n, title, lede, children }: { n: number; title: string; lede?: string; children: React.ReactNode }) => (
  <section className="card border border-line bg-white p-5 shadow-card sm:p-6">
    <div className="flex items-baseline gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-tint font-mono text-[11px] font-semibold text-accent">{n}</span>
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.015em]">{title}</h2>
        {lede && <p className="t-small mt-0.5">{lede}</p>}
      </div>
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

const Choice = ({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
  <button type="button" onClick={onClick} aria-pressed={on}
    className={cn("rounded-[14px] border p-4 text-left transition", on ? "border-accent bg-accent-tint ring-2 ring-accent/15" : "border-line-2 hover:bg-paper", className)}>
    {children}
  </button>
);

export function BookingForm({
  user, freeLeft, properties, planInfo, initialProperty, initialPlan, welcome = false,
}: {
  user: Pick<User, "freeVisitUsedAt" | "freeRevokedAt" | "tz">;
  /** launch-offer places still free to book, across every owner */
  freeLeft: number;
  properties: Property[];
  planInfo: Record<string, PlanInfo>;
  initialProperty?: string;
  initialPlan?: string;
  welcome?: boolean;
}) {
  const [state, submit] = useActionState(bookVisit, { ok: false } as FormState);
  const offerOpen = hasFreeVisit(user, freeLeft);

  /* Where a property's booking should start: its plan if it has one with
     inspections left; the free inspection if it qualifies; else what the
     link asked for; else Care. */
  const defaultsFor = (p: Property | undefined, fromLink = false) => {
    const plan = p ? planInfo[p.id] : undefined;
    /* A link that names a plan ("Book it free" → one-time) means it. */
    const asked = fromLink && !!initialPlan;
    const mode: "plan" | "buy" = plan && plan.left.visits > 0 && !asked ? "plan" : "buy";
    const planId = offerOpen && p && qualifies(p) ? "one-time"
      : initialPlan && ["one-time", "care", "care-plus"].includes(initialPlan) ? initialPlan
      : plan ? "one-time" : "care";
    return { mode, planId, planClean: !!plan && plan.left.cleans > 0 };
  };

  const start = initialProperty && properties.some((p) => p.id === initialProperty) ? initialProperty : properties[0]?.id ?? "";
  const [propertyId, setPropertyId] = useState(start);
  const property = properties.find((p) => p.id === propertyId);
  const plan = property ? planInfo[property.id] : undefined;
  const isPlot = property?.kind === "plot";
  const served = property ? inServiceArea(property) : true;

  const init = defaultsFor(property, true);
  const [service, setService] = useState<VisitKind>("inspection");
  const [mode, setMode] = useState<"plan" | "buy">(init.mode);
  const [planId, setPlanId] = useState(init.planId);
  const [tierId, setTierId] = useState<"refresh" | "deep">("refresh");
  const [adds, setAdds] = useState<Record<string, number>>({});
  const [planClean, setPlanClean] = useState(init.planClean);
  const [planService, setPlanService] = useState("");
  const [date, setDate] = useState(() => firstBookable());
  const [slot, setSlot] = useState(SLOTS[1]);
  const [liveCall, setLiveCall] = useState(false);

  const pick = (id: string) => {
    const p = properties.find((x) => x.id === id);
    const d = defaultsFor(p);
    setPropertyId(id);
    setAdds({});
    setMode(d.mode);
    setPlanId(d.planId);
    setPlanClean(d.planClean);
    setPlanService("");
    if (p?.kind === "plot") setService("inspection");
  };

  const kind: VisitKind = isPlot ? "plot" : service;
  const size = property?.size ?? "2";
  const usePlan = kind === "inspection" && mode === "plan" && !!plan && plan.left.visits > 0;
  const buyPlanId = kind === "plot" ? "plot-once" : kind === "cleaning" ? "cleaning" : usePlan ? plan!.planId : planId;
  /* Shown live as they choose, and re-decided on the server when they
     submit — this copy is for the price on screen, not for the bill. */
  const founding = !usePlan && eligible(user, freeLeft, property, kind, buyPlanId);
  const blocked = offerOpen && !founding && !usePlan ? blockedBecause(property, kind, buyPlanId) : null;
  const cleanOk = !!plan && plan.left.cleans > 0 && ((kind === "cleaning" && tierId === "refresh") || (kind === "inspection" && !!adds.cleaning));
  const serviceOk = !!plan && plan.planId === "care-plus" && plan.left.services > 0 && kind === "inspection";

  const q = useMemo(
    () => quote({
      kind, planId: buyPlanId, size, tierId: kind === "cleaning" ? tierId : "", addOns: adds, founding,
      rooms: property?.rooms,
      plan: usePlan ? { name: plan!.name, left: plan!.left.visits - 1, total: plan!.total } : null,
      planClean: planClean && cleanOk, planService: serviceOk && !!planService.trim(),
    }),
    [kind, buyPlanId, size, tierId, adds, founding, property, usePlan, plan, planClean, cleanOk, serviceOk, planService],
  );
  const extras = property ? extraRooms(property.size, property.rooms, buyPlanId) : [];

  /* One clean per visit: the deeper one wins, the counters stay honest. */
  const setAdd = (k: string, n: number) => setAdds((a) => {
    const next = { ...a };
    if (n > 0) next[k] = n; else delete next[k];
    if (k === "cleaning" && n > 0) delete next.deep;
    if (k === "deep" && n > 0) delete next.cleaning;
    return next;
  });

  if (!properties.length) {
    return (
      <div className="card border border-line bg-white p-8 text-center shadow-card">
        <p className="t-body">Add a property first — we need to know where an inspector is going.</p>
        <Link href="/app/properties/new" className="btn btn-accent mt-5"><Plus size={16} /> Add a property</Link>
      </div>
    );
  }

  let step = 1;

  return (
    <form action={submit} className="grid gap-4 lg:grid-cols-[1fr_340px] lg:items-start">
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="mode" value={usePlan ? "plan" : "buy"} />
      <input type="hidden" name="planId" value={buyPlanId} />
      <input type="hidden" name="tierId" value={kind === "cleaning" ? tierId : ""} />
      <input type="hidden" name="scheduledFor" value={date} />
      <input type="hidden" name="slot" value={slot} />
      {planClean && cleanOk && <input type="hidden" name="planClean" value="on" />}
      {serviceOk && planService.trim() && <input type="hidden" name="planService" value={planService.trim()} />}
      {["cleaning", "deep", "car"].map((k) => <input key={k} type="hidden" name={`add_${k}`} value={adds[k] ?? 0} />)}
      {/* what the screen promised, so the server can stop rather than charge if the last place has gone */}
      {founding && <input type="hidden" name="free" value="1" />}

      <div className="grid gap-4">
        {/* the launch offer, stated before they start choosing */}
        {offerOpen && (
          <section className="on-dark card bg-ink p-5 shadow-card sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12 text-white"><Gift size={18} /></span>
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold text-white">{founding ? "This one is free." : "Your first inspection is free."}</h2>
                <p className="mt-1 text-[14px] leading-snug text-white/70">
                  {freeLeft === 1 ? `The last of our ${LIMIT} free inspections` : `${freeLeft} of our ${LIMIT} free inspections left`} — one per owner, at no cost, body camera included.
                </p>
              </div>
            </div>
            <ul className="mt-4 grid gap-1.5">
              {terms.slice(0, 4).map((t) => (
                <li key={t} className="flex items-start gap-2 text-[13.5px] leading-snug text-white/75"><Check size={13} className="mt-[3px] shrink-0" /> {t}</li>
              ))}
            </ul>
            {blocked && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[12px] bg-white/[0.08] px-4 py-3 text-[13.5px] leading-snug text-white/80">
                <Info size={14} className="shrink-0" /> <span className="min-w-0 flex-1">{blocked}</span>
                {property && qualifies(property) && kind === "inspection" && (
                  <button type="button" onClick={() => { setMode("buy"); setPlanId("one-time"); }} className="btn btn-sm btn-line text-white">Use my free inspection</button>
                )}
              </div>
            )}
          </section>
        )}

        {/* 1 — where */}
        <Group n={step++} title="Which property?">
          <div className="grid gap-2">
            {properties.map((p) => (
              <button key={p.id} type="button" onClick={() => pick(p.id)} aria-pressed={propertyId === p.id}
                className={cn("flex items-center gap-3 rounded-[14px] border p-4 text-left transition", propertyId === p.id ? "border-accent bg-accent-tint ring-2 ring-accent/15" : "border-line-2 hover:bg-paper")}>
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", propertyId === p.id ? "bg-accent text-white" : "bg-beige text-text-2")}>
                  {p.kind === "plot" ? <LandPlot size={17} /> : <MapPin size={17} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{p.label}</span>
                  <span className="t-small block truncate">{p.address}{p.city ? `, ${p.city}` : ""}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="chip">{p.kind === "plot" ? "Plot" : bhkLabel[p.size]}</span>
                  {planInfo[p.id] && <span className="chip chip-accent">{planInfo[p.id].name}</span>}
                </span>
              </button>
            ))}
            <Link href="/app/properties/new" className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-dashed border-line-2 text-[13.5px] font-semibold text-text-2 transition hover:border-ink hover:text-ink"><Plus size={14} /> Add another property</Link>
          </div>
        </Group>

        {!served && property && (
          <section className="card flex items-start gap-3 border border-warn/30 bg-warn-soft p-5">
            <MapPinOff size={18} className="mt-0.5 shrink-0 text-warn" />
            <div>
              <div className="text-[15px] font-semibold">We are not in {property.city} yet.</div>
              <p className="t-small mt-1 leading-snug">We cover {HOME_CITY} and 20 km around it, so a visit here could not be walked{property.pin ? "" : " — or the property is not pinned yet, so we cannot tell how far it is"}. If the city on this property is wrong, <Link href={`/app/properties/${property.id}/edit` as Route} className="font-medium text-accent underline underline-offset-4">correct it</Link>.</p>
            </div>
          </section>
        )}

        {/* 2 — what */}
        {!isPlot && (
          <Group n={step++} title="What should we do?" lede="An inspection is a person walking every room. A clean is the crew, with your inspector on site the whole time.">
            <div className="grid grid-cols-2 gap-2">
              {([["inspection", "Inspection", ClipboardCheck], ["cleaning", "Cleaning", Sparkles]] as const).map(([k, l, I]) => (
                <Choice key={k} on={service === k} onClick={() => setService(k)} className="flex items-center gap-2.5 px-4 py-3.5">
                  <I size={17} className={service === k ? "text-accent" : "text-text-3"} />
                  <span className="text-[15px] font-semibold">{l}</span>
                </Choice>
              ))}
            </div>

            {service === "inspection" ? (
              <div className="mt-4 grid gap-2">
                {plan && (
                  <Choice on={usePlan} onClick={() => plan.left.visits > 0 && setMode("plan")} className={cn(plan.left.visits === 0 && "cursor-not-allowed opacity-60")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><span className="text-[15.5px] font-semibold">{plan.name} inspection</span><span className="chip chip-accent">Your plan</span></div>
                        <p className="t-small mt-1 leading-snug">
                          {plan.left.visits > 0
                            ? `${plan.left.visits} of ${plan.total} left this plan year — already paid for.`
                            : `All ${plan.total} inspections this year are booked. Move one on the Visits page, or book an extra one below.`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right"><div className="text-[17px] font-medium">₹0</div><div className="t-small">on your plan</div></div>
                    </div>
                  </Choice>
                )}
                {plans.filter((p) => !plan || p.id === "one-time").map((p) => {
                  const price = quote({ kind: "inspection", planId: p.id, size, tierId: "", addOns: {}, rooms: property?.rooms }).total;
                  const on = !usePlan && planId === p.id;
                  return (
                    <Choice key={p.id} on={on} onClick={() => { setMode("buy"); setPlanId(p.id); }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[15.5px] font-semibold">{plan ? "An extra one-time visit" : p.name}</span>
                            {p.popular && !plan && <span className="chip chip-accent">Most chosen</span>}
                            {offerOpen && p.id === "one-time" && property && qualifies(property) && <span className="chip chip-pass">Free for you</span>}
                          </div>
                          <p className="t-small mt-1 leading-snug">{plan ? "On top of your plan's inspections — 25% when you book." : p.tagline}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[17px] font-medium tabular-nums">{offerOpen && p.id === "one-time" && property && qualifies(property) ? <><span className="mr-1 text-[14px] font-normal text-text-3 line-through">{inr(price)}</span>free</> : inr(price)}</div>
                          <div className="t-small">{p.period}</div>
                        </div>
                      </div>
                      {on && !plan && (
                        <ul className="mt-3 grid gap-1.5 border-t border-accent/15 pt-3">
                          {p.includes.slice(0, 4).map((x) => <li key={x} className="flex gap-2 text-[13px] leading-snug text-accent-2"><Check size={13} className="mt-0.5 shrink-0" /> {x}</li>)}
                          {(p.visits ?? 1) > 1 && <li className="flex gap-2 text-[13px] leading-snug text-accent-2"><Check size={13} className="mt-0.5 shrink-0" /> The next three visits are booked for you, a quarter apart — move any of them</li>}
                        </ul>
                      )}
                    </Choice>
                  );
                })}
                {plan && <p className="t-small px-1">To move this home onto Care+, use <Link href="/app/plan" className="font-medium text-accent underline underline-offset-4">Plan & cover</Link>.</p>}
                {extras.length > 0 && !usePlan && (
                  <p className="t-small rounded-[12px] bg-paper px-4 py-3 leading-snug">
                    This home has {extras.map((e) => `${e.n} ${e.one.toLowerCase()}${e.n > 1 ? "s" : ""}`).join(", ")} past a {bhkLabel[size]} layout — {founding ? "included in your free inspection." : "charged per inspection, shown in your total."}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {tiers.map((t) => {
                  const on = tierId === t.id;
                  const included = t.id === "refresh" && !!plan && plan.left.cleans > 0 && planClean;
                  return (
                    <Choice key={t.id} on={on} onClick={() => setTierId(t.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[15.5px] font-semibold">{t.name}</div>
                          <p className="t-small mt-1 leading-snug">{t.pick}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[17px] font-medium tabular-nums">{included ? "₹0" : inr(t.price[size])}</div>
                          <div className="t-small">{t.hours[size]} · crew of {t.crew[size]}</div>
                        </div>
                      </div>
                      {on && <p className="mt-3 border-t border-accent/15 pt-3 text-[13px] leading-snug text-accent-2">{t.doesnt}</p>}
                    </Choice>
                  );
                })}
                {plan && plan.left.cleans > 0 && tierId === "refresh" && (
                  <Toggle on={planClean} onChange={setPlanClean} title={`Use one of your included refresh cleans (${plan.left.cleans} left)`} note={`${plan.name} includes two a year. Turn this off to pay for this one and keep them.`} />
                )}
              </div>
            )}
          </Group>
        )}

        {/* 3 — extras */}
        {kind !== "cleaning" && (
          <Group n={step++} title="Anything else while they are there?" lede="Added to a visit somebody is already making, so it costs what it adds — not the full standalone price.">
            <div className="grid gap-2">
              {!isPlot && tiers.map((t) => {
                const k = t.id === "refresh" ? "cleaning" : "deep";
                return (
                  <Counter key={t.id} on={!!adds[k]} I={Sparkles} max={1}
                    title={t.name} note={`${t.hours[size]} · ${t.tagline.toLowerCase().replace(/\.$/, "")}`}
                    price={k === "cleaning" && planClean && plan && plan.left.cleans > 0 ? "included" : inr(t.rider[size])} n={adds[k] ?? 0}
                    onChange={(n) => setAdd(k, n)} />
                );
              })}
              {!!adds.cleaning && plan && plan.left.cleans > 0 && (
                <Toggle on={planClean} onChange={setPlanClean} title={`Use one of your included refresh cleans (${plan.left.cleans} left)`} note="Turn this off to pay for this one and keep them." />
              )}
              <Counter on I={Video} max={1} locked
                title="Full-visit video recording"
                note="Body camera from the moment they walk in until they leave · the whole video on a private link"
                price="included" n={1} onChange={() => {}} />
              <Counter on={!!adds.car} I={Car} max={6} title="Car inspection" note="Started & idled, battery, tyres, leaks, odometer photo"
                price={`${inr(700)} each`} n={adds.car ?? 0} onChange={(n) => setAdd("car", n)} />
              {serviceOk && (
                <div className="rounded-[14px] border border-line-2 p-4">
                  <div className="flex items-center gap-2 text-[14.5px] font-semibold"><Wrench size={15} className="text-accent" /> An included maintenance service <span className="chip chip-accent">{plan!.left.services} left</span></div>
                  <p className="t-small mt-1 leading-snug">Care+ includes two a year — AC service, a plumbing check, anything. Say what you want done and we line up the pro for this visit.</p>
                  <textarea value={planService} onChange={(e) => setPlanService(e.target.value)} rows={2} maxLength={300} placeholder="Service both split ACs before summer"
                    className="mt-2 w-full rounded-[12px] border border-line-2 bg-white px-4 py-3 text-[14.5px] leading-relaxed outline-none transition placeholder:text-text-3 focus:border-accent focus:ring-4 focus:ring-accent/10" />
                </div>
              )}
            </div>
          </Group>
        )}

        {/* 4 — when */}
        <Group n={step++} title="When?" lede="Pick a day and a window. We give the inspector the whole window, so nobody is rushed out of a room.">
          <DayPicker date={date} onDate={setDate} slot={slot} onSlot={setSlot} tz={user.tz} />

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[14px] border border-line-2 p-4 transition hover:bg-paper has-[:checked]:border-accent has-[:checked]:bg-accent-tint">
            <input type="checkbox" name="liveCall" checked={liveCall} onChange={(e) => setLiveCall(e.target.checked)} className="peer sr-only" />
            <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border transition", liveCall ? "border-accent bg-accent text-white" : "border-line-2")}>{liveCall && <Check size={12} strokeWidth={3} />}</span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[14.5px] font-medium"><Video size={14} /> Call me live during the visit</span>
              <span className="t-small block leading-snug">The inspector rings you from inside the house so you can see a room yourself and ask for another angle.</span>
            </span>
          </label>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-[13px] font-medium text-text-2">Anything specific to look at?</span>
            <textarea name="notes" rows={2} maxLength={600} placeholder="Photograph the north-east survey stone first. Check the geyser in the second bathroom."
              className="w-full rounded-[12px] border border-line-2 bg-white px-4 py-3 text-[15px] leading-relaxed outline-none transition placeholder:text-text-3 focus:border-accent focus:ring-4 focus:ring-accent/10" />
          </label>
        </Group>
      </div>

      {/* ── the running total ───────────────────────────────
           Sticky on both, but on a phone it shows only what it has to,
           and it sits above the tab bar rather than behind it. */}
      <aside className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 lg:bottom-auto lg:top-[76px]">
        <div className="card border border-line bg-white p-5 shadow-float">
          <div className="t-label hidden lg:block">Your order</div>
          <ul className="mt-3 hidden gap-3 lg:grid">
            {q.lines.map((l) => (
              <li key={l.k} className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium">{l.k}</span>
                  <span className="t-small block leading-snug">{l.note}</span>
                </span>
                <span className="shrink-0 text-right text-[14px] font-medium tabular-nums">
                  {l.was !== undefined && <span className="mr-1.5 font-normal text-text-3 line-through">{inr(l.was)}</span>}
                  {l.v === 0 ? (l.was !== undefined ? "free" : "₹0") : inr(l.v)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between lg:mt-4 lg:border-t lg:border-line lg:pt-4">
            <span className="min-w-0">
              <span className="block text-[14px] font-medium">{q.lines[0]?.k ?? "Total"}</span>
              <span className="t-small block lg:hidden">{q.period}{q.total ? ` · ${inr(advanceOf(q.total))} now` : ""}</span>
            </span>
            <span className="text-[24px] font-medium tabular-nums tracking-[-0.03em]">{inr(q.total)}</span>
          </div>
          <p className="t-small mt-1 hidden text-right lg:block">
            {q.saved > 0 ? `${inr(q.saved)} off — launch offer` : q.recurring ? "for the year · four inspections" : q.period}
          </p>
          {q.total > 0 && (
            <div className="mt-3 grid gap-1 rounded-[12px] bg-paper px-3.5 py-3 text-[13px] tabular-nums">
              <div className="flex justify-between font-medium"><span>Pay now to confirm · 25%</span><span>{inr(advanceOf(q.total))}</span></div>
              <div className="flex justify-between text-text-2"><span>When the report is ready · 75%</span><span>{inr(q.total - advanceOf(q.total))}</span></div>
            </div>
          )}

          {state.error && <p className="mt-3 rounded-[10px] bg-fail-soft px-3 py-2.5 text-[13px] text-[#b03434]" role="alert">{state.error}</p>}

          <SubmitButton className={cn("mt-4 w-full", !served && "pointer-events-none opacity-50")} pendingLabel="Booking…">
            {q.total > 0 ? `Book and pay ${inr(advanceOf(q.total))}` : founding ? "Book my free inspection" : usePlan ? "Book this plan inspection" : welcome ? "Book my first visit" : "Confirm booking"}
          </SubmitButton>
          <p className="t-small mt-2 text-center leading-snug">
            By booking you agree to our <Link href="/terms" className="underline underline-offset-2">Terms</Link> and <Link href={"/refunds" as Route} className="underline underline-offset-2">Refund &amp; Cancellation Policy</Link>.
          </p>
          <p className="t-small mt-3 hidden leading-snug lg:block">
            {q.total === 0
              ? "Nothing to pay. You can move or cancel it free until the day before."
              : q.recurring
                ? "25% of the plan now, the rest when the first report is ready — the full report opens once it is paid. Move or cancel any visit free until the day before; a cancelled advance is refunded."
                : "25% now, the rest when the report is ready — the full report opens once it is paid. Move or cancel free until the day before; a cancelled advance is refunded."}
          </p>
        </div>
        {welcome && <Link href="/app" className="t-small mt-3 block text-center underline underline-offset-4">Skip for now — I will book later</Link>}
      </aside>
    </form>
  );
}

function Counter({ on, I, title, note, price, n, max, locked = false, onChange }: { on: boolean; I: typeof Car; title: string; note: string; price: string; n: number; max: number; locked?: boolean; onChange: (n: number) => void }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-[14px] border p-4 transition", on ? "border-accent bg-accent-tint" : "border-line-2")}>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", on ? "bg-accent text-white" : "bg-beige text-text-2")}><I size={16} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-semibold">{title}</div>
        <div className="t-small leading-snug">{note} · <b className="text-ink">{price}</b></div>
      </div>
      {locked ? (
        <span className="chip chip-pass shrink-0"><Check size={11} className="mr-0.5" /> Included</span>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => onChange(Math.max(0, n - 1))} aria-label={`Fewer ${title}`} disabled={!n} className="grid h-8 w-8 place-items-center rounded-full border border-line-2 text-text-2 transition hover:border-ink hover:text-ink disabled:opacity-30"><Minus size={13} /></button>
          <span className="w-5 text-center font-mono text-[14px] tabular-nums">{n}</span>
          <button type="button" onClick={() => onChange(Math.min(max, n + 1))} aria-label={`More ${title}`} disabled={n >= max} className="grid h-8 w-8 place-items-center rounded-full border border-line-2 text-text-2 transition hover:border-ink hover:text-ink disabled:opacity-30"><Plus size={13} /></button>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onChange, title, note }: { on: boolean; onChange: (v: boolean) => void; title: string; note: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on}
      className={cn("flex items-start gap-3 rounded-[14px] border p-4 text-left transition", on ? "border-accent bg-accent-tint" : "border-line-2 hover:bg-paper")}>
      <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border transition", on ? "border-accent bg-accent text-white" : "border-line-2")}>{on && <Check size={12} strokeWidth={3} />}</span>
      <span className="min-w-0">
        <span className="block text-[14.5px] font-medium">{title}</span>
        <span className="t-small block leading-snug">{note}</span>
      </span>
    </button>
  );
}
