"use server";

/* ════════════════════════════════════════════════════════════════
   Every write the owner app makes. Each one re-checks who is asking
   — a server action is a public endpoint, and the fact that the
   button was only rendered for the right person proves nothing.
   Everything the browser sends is re-validated here: dates, prices,
   add-ons and plans are decided on the server, never taken from the form.
   ════════════════════════════════════════════════════════════════ */

import { APPS_LIVE } from "@/lib/flags";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  changePassword, cleanEmail, currentUser, devSignInOwner, finishPasswordReset, homeFor, inspectorDoorOpen, requireOwner, resendVerification,
  signInWithPassword, signOut, signUpWithPassword, startOtp, startPasswordReset, verifyOtp, type Side,
} from "@/lib/auth";
import { NOT_ON_ROSTER } from "@/lib/roster";
import { advanceOf, balanceDue } from "@/lib/payments";
import { isLive, liveRefusal } from "@/lib/liveRepairs";
import { refundOwed } from "@/lib/refunds";
import { db, invoiceRef, mutate, now, ticketRef, uid, visitRef } from "@/lib/store";
import { ADD_ON_LIMITS, SLOTS, inr, planPriceAt, quote } from "@/lib/quote";
import { eligible, LIMIT, spotsLeft } from "@/lib/offer";
import { fmtDayDate, isBookable, todayKey } from "@/lib/format";
import { newOtp, payoutFor } from "@/lib/payout";
import { inServiceArea, normaliseCity, HOME_CITY } from "@/lib/city";
import { clampRooms, extraRooms, ROOM_KEYS } from "@/lib/rooms";
import { allowanceLeft, effectiveStatus, isPlanId, liveSub, planAllowance, planName, rhythm, upgradePrice } from "@/lib/plans";
import { repairBill } from "@/lib/repair";
import { pushEvent } from "@/lib/events";
import { approveIssueIn, cancelVisitIn, closeIfSettled } from "@/lib/lifecycle";
import { parsePhone, reachOn } from "@/lib/phone";
import { TICKET_TOPICS } from "@/lib/tickets";
import { bhkKeys, type BhkKey } from "@/lib/cleaning";
import type { DB, HomeType, Pin, Property, RoomKey, Subscription, Visit, VisitKind } from "@/lib/types";

const s = (fd: FormData, k: string, max = 400) => String(fd.get(k) ?? "").trim().slice(0, max);
const n = (fd: FormData, k: string) => Number(fd.get(k) ?? 0) || 0;
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

export type FormState = { ok: boolean; error?: string; devCode?: string | null; phone?: string; message?: string; devLink?: string | null };

/* ── sign in ─────────────────────────────────────────────────── */

/* Hiding the sign-in pages is not enough: these actions can be called
   without the page. While the apps are off, none of them does anything —
   no code is sent, no account is made. */
const APPS_CLOSED: FormState = { ok: false, error: "Not available." };

const sideOf = (fd: FormData): Side => (s(fd, "as", 12) === "inspector" ? "inspector" : "owner");

export async function requestCode(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!APPS_LIVE) return APPS_CLOSED;
  const cc = s(fd, "cc", 4) || "91";
  const raw = s(fd, "phone", 40);
  /* Codes are only for the inspector door — owners sign in with Google.
     Nobody off the roster is even sent one. */
  if (sideOf(fd) !== "inspector") return { ok: false, error: "Owners sign in with Google or their email." };
  const parsed = parsePhone(cc, raw);
  if (parsed.ok && !(await inspectorDoorOpen(parsed.phone))) return { ok: false, error: NOT_ON_ROSTER };
  const res = await startOtp(cc, raw);
  if (!res.ok) return { ok: false, error: res.error, phone: res.phone };
  return { ok: true, phone: res.phone, devCode: res.devCode };
}

export async function confirmCode(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!APPS_LIVE) return APPS_CLOSED;
  const res = await verifyOtp(s(fd, "phone", 20), s(fd, "code", 8), sideOf(fd));
  if (!res.ok) return { ok: false, error: res.error, phone: s(fd, "phone", 20) };
  redirect(res.role === "owner" && !res.onboarded ? "/welcome" : homeFor(res.role));
}

export async function doSignOut() {
  await signOut();
  redirect("/");
}

/** Sign out and land back on the sign-in form, keeping whichever side
    they were heading for. The owner and the inspector app share one
    session, so switching between them has to be a real thing you can
    do — not something you work out by hunting for Sign out. */
export async function switchAccount(fd: FormData) {
  const as = String(fd.get("as") ?? "");
  await signOut();
  redirect(as === "inspector" ? "/signin?as=inspector" : "/signin");
}

/** Development only: sign in as any owner by email — a laptop has no
    Google keys. Production refuses. */
export async function devSignIn(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!APPS_LIVE) return APPS_CLOSED;
  if (process.env.NODE_ENV === "production") return { ok: false, error: "Not available." };
  const email = s(fd, "email", 200).toLowerCase();
  if (!isEmail(email)) return { ok: false, error: "That email address does not look right." };
  const user = await devSignInOwner(email);
  if (!user) return { ok: false, error: "Not available." };
  redirect(user.onboardedAt && reachOn(user) ? "/app" : "/welcome");
}

/* ── owners: email and password ──────────────────────────────── */

/* Passwords are read as typed — never trimmed, a space is a character. */
const pw = (fd: FormData, k: string) => String(fd.get(k) ?? "").slice(0, 400);
const homeOf = (u: { onboardedAt: string | null; contactPhone?: string; phone: string }) => (u.onboardedAt && reachOn(u) ? "/app" : "/welcome");

export async function passwordSignIn(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!APPS_LIVE) return APPS_CLOSED;
  const res = await signInWithPassword(s(fd, "email", 200), pw(fd, "password"));
  if (!res.ok) return { ok: false, error: res.error };
  redirect(homeOf(res.user));
}

export async function passwordSignUp(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!APPS_LIVE) return APPS_CLOSED;
  const res = await signUpWithPassword(s(fd, "email", 200), pw(fd, "password"));
  if (!res.ok) return { ok: false, error: res.error };
  redirect("/welcome");
}

export async function forgotPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!APPS_LIVE) return APPS_CLOSED;
  const r = await startPasswordReset(s(fd, "email", 200));
  if (r.error) return { ok: false, error: r.error };
  return { ok: true, message: "If that email has an account, a link to choose a new password is on its way. It works for 30 minutes.", devLink: r.devLink };
}

export async function resetPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!APPS_LIVE) return APPS_CLOSED;
  if (pw(fd, "password") !== pw(fd, "again")) return { ok: false, error: "The two passwords are not the same." };
  const res = await finishPasswordReset(s(fd, "token", 2000), pw(fd, "password"));
  if (!res.ok) return { ok: false, error: res.error };
  redirect(homeOf(res.user));
}

export async function savePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  if (pw(fd, "password") !== pw(fd, "again")) return { ok: false, error: "The two new passwords are not the same." };
  const r = await changePassword(user.id, pw(fd, "current"), pw(fd, "password"));
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath("/app/account");
  return { ok: true, message: "Password saved. Every other device is signed out." };
}

export async function sendVerification(): Promise<FormState> {
  const user = await requireOwner();
  const r = await resendVerification(user.id);
  if (r.error) return { ok: false, error: r.error };
  return { ok: true, message: "Sent — check your inbox, and your spam folder.", devLink: r.devLink };
}

/* ── profile & account ───────────────────────────────────────── */

const validZone = (tz: string) => {
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; }
};

export async function saveProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Your session ended. Sign in again." };
  const name = s(fd, "name", 120);
  const email = s(fd, "email", 200).toLowerCase();
  const tz = s(fd, "tz", 60);
  if (!name) return { ok: false, error: "We need a name to put on your reports." };
  if (email && !isEmail(email)) return { ok: false, error: "That email address does not look right." };
  /* An email can be a sign-in, so two owners cannot share one — and one
     that changes is unconfirmed until its own link is used. */
  if (email && email !== user.email) {
    if (!cleanEmail(email)) return { ok: false, error: "That email address does not look right." };
    const d0 = await db();
    if (d0.users.some((x) => x.id !== user.id && x.email === email && !x.deletedAt && x.role !== "inspector")) {
      return { ok: false, error: "That email already belongs to another account." };
    }
  }
  const stored = (await db()).users.find((x) => x.id === user.id);
  if (!email && stored?.passwordHash) return { ok: false, error: "You sign in with this email — it cannot be blank." };
  /* Required: the inspector calls it from the door, and updates go to it. */
  const phone = parsePhone(s(fd, "cc", 4) || "91", s(fd, "phone", 40));
  if (!phone.ok) return { ok: false, error: phone.error };

  await mutate((d) => {
    const u = d.users.find((x) => x.id === user.id)!;
    u.name = name;
    if (u.email !== email) u.emailVerifiedAt = null;
    u.email = email;
    u.contactPhone = phone.phone;
    u.livesIn = s(fd, "livesIn", 120);
    if (tz && validZone(tz)) u.tz = tz;
    /* A name and a number are all the welcome asks for. The property and
       the free visit are the dashboard's to offer, when they are ready. */
    if (s(fd, "step") === "welcome" && !u.onboardedAt) u.onboardedAt = now();
  });
  revalidatePath("/app", "layout");
  if (s(fd, "step") === "welcome") redirect("/app");
  return { ok: true, message: "Saved." };
}

export async function savePrefs(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  await mutate((d) => {
    const u = d.users.find((x) => x.id === user.id)!;
    u.prefs = { sms: fd.get("sms") === "on", email: fd.get("email") === "on" };
  });
  revalidatePath("/app/account");
  return { ok: true, message: "Saved." };
}

/** Close the account. Everything booked is cancelled and put right, every
    plan stops renewing, the properties are archived and everything personal
    on the row is blanked. Bills and reports keep their history. */
export async function deleteAccount(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  if (s(fd, "confirm", 20).toUpperCase() !== "DELETE") return { ok: false, error: "Type DELETE to confirm." };
  const d0 = await db();
  const live = d0.visits.some((v) => v.ownerId === user.id && ["en_route", "on_site"].includes(v.status));
  if (live) return { ok: false, error: "An inspector is on the way or inside one of your properties right now. Close the account once they are done." };
  /* A visit cannot be cancelled on its day — closing the account is no way round that. */
  const today = d0.visits.some((v) => v.ownerId === user.id && v.scheduledFor === todayKey() && ["scheduled", "assigned"].includes(v.status));
  if (today) return { ok: false, error: "You have a visit today, and a visit cannot be cancelled on its day. Close the account once it is done." };
  const cancelling = d0.visits.filter((v) => v.ownerId === user.id && ["unpaid", "scheduled", "assigned"].includes(v.status)).map((v) => v.id);

  await mutate((d) => {
    /* One at a time, re-checked: cancelling a plan's first visit also
       cancels the rest of its year, which must not be cancelled twice. */
    for (const v of d.visits.filter((x) => x.ownerId === user.id)) {
      if (["unpaid", "scheduled", "assigned"].includes(v.status)) cancelVisitIn(d, v, "account closed");
    }
    for (const sub of d.subscriptions.filter((x) => x.ownerId === user.id)) {
      if (sub.status === "pending") sub.status = "cancelled";
      sub.autoRenew = false;
    }
    for (const p of d.properties.filter((x) => x.ownerId === user.id && !x.archivedAt)) p.archivedAt = now();
    for (const r of d.reports.filter((x) => x.ownerId === user.id)) r.shareToken = null;
    const u = d.users.find((x) => x.id === user.id)!;
    u.name = "Closed account";
    u.email = "";
    u.livesIn = "";
    u.phone = `deleted:${u.id}`;
    u.contactPhone = "";
    u.googleSub = "";
    u.deletedAt = now();
  });
  for (const id of cancelling) await refundOwed(user.id, id);
  await signOut();
  redirect("/?closed=1");
}

/* ── properties ──────────────────────────────────────────────── */

const TYPES: HomeType[] = ["Apartment", "Villa", "Independent house", "Builder floor"];

/** Everything about a property the owner can set, read and checked. */
function readProperty(fd: FormData) {
  const kind: Property["kind"] = s(fd, "kind", 12) === "plot" ? "plot" : "home";
  const size = (bhkKeys.includes(s(fd, "size", 2) as BhkKey) ? s(fd, "size", 2) : "2") as BhkKey;
  const cityPick = s(fd, "city", 80);
  const city = normaliseCity(cityPick === "other" ? s(fd, "cityOther", 80) : cityPick) || HOME_CITY;
  const typeRaw = s(fd, "type", 40) as HomeType;
  const rooms: Record<RoomKey, number> = kind === "plot"
    ? (Object.fromEntries(ROOM_KEYS.map((k) => [k, 0])) as Record<RoomKey, number>)
    : clampRooms(size, Object.fromEntries(ROOM_KEYS.map((k) => [k, n(fd, `room_${k}`)])));
  return {
    kind,
    label: s(fd, "label", 120),
    address: s(fd, "address", 400),
    locality: s(fd, "locality", 120),
    city,
    type: kind === "home" ? (TYPES.includes(typeRaw) ? typeRaw : "Apartment") : ("" as const),
    size: kind === "plot" ? ("1" as BhkKey) : size,
    rooms,
    accessNote: s(fd, "accessNote", 600),
    keyHolderName: s(fd, "keyHolderName", 120),
    keyHolderPhone: s(fd, "keyHolderPhone", 40),
  };
}

/** The pin as the picker sends it — or none, when nobody marked one or
    what came is not a place in India. */
function readPin(fd: FormData): Pin | null {
  const rawLat = s(fd, "pinLat", 20), rawLng = s(fd, "pinLng", 20);
  if (!rawLat || !rawLng) return null;
  const lat = Number(rawLat), lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 6 || lat > 37.5 || lng < 68 || lng > 97.5) return null;
  const source = s(fd, "pinSource", 8) === "gps" ? "gps" : "map";
  const acc = Number(s(fd, "pinAccuracy", 10));
  const accuracyM = source === "gps" && s(fd, "pinAccuracy", 10) && Number.isFinite(acc) ? Math.round(acc) : null;
  const round = (x: number) => Math.round(x * 1e6) / 1e6;
  /* The owner put it there, so it is confirmed the moment it is saved. */
  return { lat: round(lat), lng: round(lng), accuracyM, source, at: now(), confirmedAt: now() };
}

export async function addProperty(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner({ allowOnboarding: true });
  const p = readProperty(fd);
  if (!p.label || !p.address) return { ok: false, error: "A name and the address, and we can take it from there." };

  const id = uid();
  await mutate((d) => {
    d.properties.push({
      id, ownerId: user.id, ...p,
      pin: readPin(fd),
      cover: p.kind === "plot" ? "balcony" : "entrance",
      createdAt: now(), archivedAt: null,
    });
    pushEvent(d, {
      ownerId: user.id, propertyId: id, type: "property.added",
      title: `${p.label} added`, body: `${p.address}${inServiceArea(p) ? "" : ` · ${p.city} — outside the area we cover`}`, href: `/app/properties/${id}`,
    });
    /* Finishing the welcome flow is what marks an owner onboarded — the
       account is only useful once there is something in it. */
    const u = d.users.find((x) => x.id === user.id)!;
    if (!u.onboardedAt) u.onboardedAt = now();
  });

  revalidatePath("/app", "layout");
  /* added on the way to the free visit: straight on to booking it */
  redirect(s(fd, "step") === "welcome" ? `/app/book?property=${id}&plan=one-time` : `/app/properties/${id}`);
}

/** The full edit, or — with scope=access — just who holds a key and how
    to get in, which is what changes most. */
export async function updateProperty(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const accessOnly = s(fd, "scope", 10) === "access";
  const next = accessOnly ? null : readProperty(fd);
  if (next && (!next.label || !next.address)) return { ok: false, error: "The property needs a name and an address." };

  const ok = await mutate((d) => {
    const p = d.properties.find((x) => x.id === id && x.ownerId === user.id && !x.archivedAt);
    if (!p) return false;
    p.accessNote = s(fd, "accessNote", 600);
    p.keyHolderName = s(fd, "keyHolderName", 120);
    p.keyHolderPhone = s(fd, "keyHolderPhone", 40);
    if (next) {
      /* A plot stays a plot and a home stays a home — the whole history is
         of one kind of place. Everything else can be corrected. */
      p.label = next.label;
      p.address = next.address;
      p.locality = next.locality;
      p.city = next.city;
      if (p.kind === "home") {
        p.type = next.type;
        p.size = next.size;
        p.rooms = clampRooms(next.size, next.rooms);
      }
      pushEvent(d, { ownerId: user.id, propertyId: p.id, type: "property.updated", title: `${p.label} updated`, body: "Visits booked from now on walk the new layout", href: `/app/properties/${p.id}` });
    }
    return true;
  });
  if (!ok) return { ok: false, error: "We could not find that property." };
  revalidatePath("/app", "layout");
  if (!accessOnly) redirect(`/app/properties/${id}?saved=1`);
  return { ok: true, message: "Saved." };
}

/** Put the pin where the owner says. Every visit from now on is measured
    from here, so the move goes on the property's record. */
export async function setPropertyPin(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const pin = readPin(fd);
  if (!pin) return { ok: false, error: "Put the pin on the map first." };
  const ok = await mutate((d) => {
    const p = d.properties.find((x) => x.id === id && x.ownerId === user.id && !x.archivedAt);
    if (!p) return false;
    const had = !!p.pin;
    p.pin = pin;
    pushEvent(d, {
      ownerId: user.id, propertyId: p.id, type: "property.pinned",
      title: had ? `${p.label} pin moved` : `${p.label} pinned`,
      body: pin.source === "gps" ? `Marked from your phone at the property${pin.accuracyM !== null ? `, ±${pin.accuracyM} m` : ""}` : "Marked on the map · every visit is measured from here",
      href: `/app/properties/${p.id}`,
    });
    return true;
  });
  if (!ok) return { ok: false, error: "We could not find that property." };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Pin saved." };
}

/** "Yes, that is it" — the owner agreeing with the spot the first
    inspector marked at the gate. */
export async function confirmPropertyPin(fd: FormData) {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const p = d.properties.find((x) => x.id === id && x.ownerId === user.id && !x.archivedAt);
    if (!p?.pin || p.pin.confirmedAt) return;
    p.pin.confirmedAt = now();
    pushEvent(d, { ownerId: user.id, propertyId: p.id, type: "property.pinned", title: `${p.label} pin confirmed`, body: "The spot your inspector marked · every visit is measured from here", href: `/app/properties/${p.id}` });
  });
  revalidatePath("/app", "layout");
}

/** Take a property out of the app. Refused while anything is still booked
    on it or a plan is running — those have to be cancelled first, so no
    visit or bill is left hanging off a property nobody can see. */
export async function archiveProperty(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const d0 = await db();
  const p = d0.properties.find((x) => x.id === id && x.ownerId === user.id && !x.archivedAt);
  if (!p) return { ok: false, error: "We could not find that property." };
  const booked = d0.visits.filter((v) => v.propertyId === id && ["unpaid", "scheduled", "assigned", "en_route", "on_site", "submitted"].includes(v.status));
  if (booked.length) return { ok: false, error: `${booked.length} ${booked.length === 1 ? "visit is" : "visits are"} still booked or in progress here. Cancel ${booked.length === 1 ? "it" : "them"} first.` };
  const sub = liveSub(d0.subscriptions, id);
  if (sub && effectiveStatus(sub) === "active" && sub.autoRenew) return { ok: false, error: `${planName(sub.planId)} is still renewing on this property. Turn renewal off on the Plan page first.` };
  const pending = d0.issues.filter((i) => i.propertyId === id && i.decision === "approved" && i.repair && i.repair.status !== "completed");
  if (pending.length) return { ok: false, error: "A repair you approved here has not been done yet." };

  await mutate((d) => {
    const x = d.properties.find((q) => q.id === id)!;
    x.archivedAt = now();
    for (const r of d.reports.filter((q) => q.propertyId === id)) r.shareToken = null;
    pushEvent(d, { ownerId: user.id, propertyId: id, type: "property.archived", title: `${x.label} removed`, body: "Its reports and bills stay in your history", href: "/app/properties" });
  });
  revalidatePath("/app", "layout");
  redirect("/app/properties");
}

/* ── booking ─────────────────────────────────────────────────── */

type NewVisit = Pick<Visit, "ownerId" | "propertyId" | "kind" | "planId" | "scheduledFor" | "slot"> & Partial<Visit>;

function makeVisit(d: DB, property: Property, v: NewVisit): Visit {
  const addOns = v.addOns ?? {};
  return {
    id: uid(), ref: visitRef(d), tierId: "", addOns, status: "scheduled", inspectorId: "",
    amountInr: 0, paid: false, liveCall: false, notes: "", founding: false,
    subscriptionId: null, usesPlan: false, planClean: false, planService: "", lines: [],
    payoutInr: payoutFor(property, v.kind, addOns), otp: newOtp(), otpTries: 0, exitCode: newOtp(), exitTries: 0,
    claimedAt: null, checkIn: null, draft: null, recording: true, rating: null,
    createdAt: now(), cancelledAt: null, startedAt: null, endedAt: null, reportId: null,
    advanceInr: 0, overtimeInr: 0,
    ...v,
  };
}

export async function bookVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const propertyId = s(fd, "propertyId", 60);
  const scheduledFor = s(fd, "scheduledFor", 12);
  const slot = s(fd, "slot", 40);
  const d0 = await db();
  const property = d0.properties.find((p) => p.id === propertyId && p.ownerId === user.id && !p.archivedAt);
  if (!property) return { ok: false, error: "Pick which property this visit is for." };
  if (!inServiceArea(property)) return { ok: false, error: `We cover ${HOME_CITY} and 20 km around it. ${property.pin ? "This property is further out" : "Pin this property on the map so we can check the distance"} — we will tell you the day that changes.` };
  if (!isBookable(scheduledFor)) return { ok: false, error: "Pick a day from the calendar — at least two clear days from today." };
  if (!SLOTS.includes(slot)) return { ok: false, error: "Pick a time window." };

  /* What is being booked — decided here, whatever the form says. */
  const kindRaw = s(fd, "kind", 20);
  const kind: VisitKind = property.kind === "plot" ? "plot" : kindRaw === "cleaning" ? "cleaning" : "inspection";
  const mode = s(fd, "mode", 8);
  const planPick = s(fd, "planId", 40);
  const planId = kind === "plot" ? "plot-once" : kind === "cleaning" ? "cleaning" : ["one-time", "care", "care-plus"].includes(planPick) ? planPick : "one-time";
  const tierId = kind === "cleaning" ? (s(fd, "tierId", 12) === "deep" ? "deep" : "refresh") : "";

  const addOns: Record<string, number> = {};
  for (const [k, max] of Object.entries(ADD_ON_LIMITS)) {
    if (kind !== "inspection" && (k === "cleaning" || k === "deep")) continue;
    const v = Math.max(0, Math.min(max, Math.round(n(fd, `add_${k}`))));
    if (v > 0) addOns[k] = v;
  }
  if (addOns.cleaning && addOns.deep) delete addOns.cleaning; // one clean per visit — the deeper one wins

  const sub = liveSub(d0.subscriptions, property.id);
  const left = sub ? allowanceLeft(sub) : null;

  const usePlan = mode === "plan" && kind === "inspection";
  if (usePlan && (!sub || !left || left.visits < 1)) return { ok: false, error: "There are no plan inspections left to book this year." };
  if (!usePlan && kind === "inspection" && isPlanId(planId) && sub) {
    return { ok: false, error: `${property.label} is already on ${planName(sub.planId)}. Book one of its inspections instead — or change the plan on the Plan page.` };
  }
  const wantsPlanClean = fd.get("planClean") === "on";
  const planClean = wantsPlanClean && !!sub && !!left && left.cleans > 0 && ((kind === "cleaning" && tierId === "refresh") || (kind === "inspection" && !!addOns.cleaning));
  const service = s(fd, "planService", 300);
  const planService = service && sub?.planId === "care-plus" && left && left.services > 0 && kind === "inspection" ? service : "";
  if (service && !planService) return { ok: false, error: "There are no maintenance services left on this plan year." };
  /* A plan whose own advance is unpaid gives nothing away yet. */
  const planUnpaid = !!sub && d0.visits.some((x) => x.id === sub.startedByVisitId && x.status === "unpaid");
  if (planUnpaid && (usePlan || planClean || planService)) return { ok: false, error: `Pay the 25% on ${planName(sub!.planId)} first — then its visits and cleans are yours to book.` };

  /* Whether the launch offer applies is decided here, never from the form… */
  const founding = !usePlan && eligible(user, spotsLeft(d0.visits), property, kind, planId);
  /* …but a form that showed it free is stopped, not charged, if the place went in the meantime. */
  if (fd.get("free") === "1" && !founding) {
    revalidatePath("/app/book");
    return {
      ok: false,
      error: user.freeVisitUsedAt
        ? "Your free inspection is already booked, so this one is charged normally — its price is on the page now."
        : user.freeRevokedAt
        ? "The free inspection is no longer on this account, so this one is charged normally — its price is on the page now."
        : `The last of the ${LIMIT} free inspections has just been booked, so this one is charged normally — its price is on the page now.`,
    };
  }

  const q = quote({
    kind, planId, size: property.size, tierId, addOns, founding, rooms: property.rooms,
    plan: usePlan && sub && left ? { name: planName(sub.planId), left: left.visits - 1, total: sub.visitsTotal } : null,
    planClean, planService: !!planService,
  });
  const buyingPlan = q.recurring;
  /* 25% now; the visit goes on the board once it is paid. A free
     launch-offer inspection with nothing added owes nothing. */
  const advance = advanceOf(q.total);
  const firstStatus = advance > 0 ? "unpaid" : "scheduled";

  let visitId = "";
  await mutate((d) => {
    const newSubId = buyingPlan ? uid() : null;
    const subId = usePlan || planClean || planService ? sub!.id : newSubId;
    const v = makeVisit(d, property, {
      ownerId: user.id, propertyId: property.id, kind, planId, tierId, addOns, scheduledFor, slot,
      amountInr: q.total, liveCall: fd.get("liveCall") === "on", notes: s(fd, "notes", 600),
      founding, subscriptionId: subId, usesPlan: usePlan || buyingPlan, planClean, planService, lines: q.lines,
      status: firstStatus, advanceInr: advance,
    });
    d.visits.push(v);
    visitId = v.id;

    if (usePlan || planClean || planService) {
      const x = d.subscriptions.find((y) => y.id === sub!.id)!;
      if (usePlan) x.visitsUsed += 1;
      if (planClean) x.cleansUsed += 1;
      if (planService) x.servicesUsed += 1;
    }

    if (founding) {
      /* One free inspection per owner: spent the moment it is booked, not
         when the visit happens, so it cannot be claimed twice. Cancelling
         gives it back. */
      const u = d.users.find((x) => x.id === user.id)!;
      u.freeVisitUsedAt = now();
    }
    if (advance > 0) {
      pushEvent(d, {
        ownerId: user.id, propertyId: property.id, visitId: v.id, type: "visit.booked",
        title: "Booked — pay 25% to confirm",
        body: `${property.label} · ${fmtDayDate(scheduledFor)} · ${slot} · ${inr(advance)} now, ${inr(q.total - advance)} when the report is ready`,
        href: `/app/visits/${v.id}`, action: true,
      });
    } else if (founding) {
      pushEvent(d, {
        ownerId: user.id, propertyId: property.id, visitId: v.id, type: "visit.booked",
        title: "Your free inspection is booked",
        body: `${property.label} · ${fmtDayDate(scheduledFor)} · ${slot} · nothing to pay, body camera included`,
        href: `/app/visits/${v.id}`,
      });
    } else {
      pushEvent(d, {
        ownerId: user.id, propertyId: property.id, visitId: v.id, type: "visit.booked",
        title: usePlan ? "Plan inspection booked" : "Visit booked",
        body: `${property.label} · ${fmtDayDate(scheduledFor)} · ${slot}`,
        href: `/app/visits/${v.id}`,
      });
    }

    /* A yearly plan: it exists from now, starts (and is billed) with this
       first visit, and books the rest of its year — quarterly — so nobody
       has to remember. Every one of them can be moved or cancelled. */
    if (buyingPlan && newSubId) {
      const a = planAllowance(planId);
      const extras = extraRooms(property.size, property.rooms, planId);
      const next = rhythm(scheduledFor, a.visits - 1);
      const plan: Subscription = {
        id: newSubId, ownerId: user.id, propertyId: property.id, planId,
        visitsTotal: a.visits, visitsUsed: 1 + next.length, cleansTotal: a.cleans, cleansUsed: 0,
        servicesTotal: a.services, servicesUsed: 0,
        amountInr: planPriceAt(planId, property.size) + extras.reduce((t, e) => t + e.perVisit, 0) * a.visits,
        startedAt: now(), renewsAt: null, status: "pending", autoRenew: true,
        startedByVisitId: v.id, coverUsedInr: 0,
      };
      d.subscriptions.push(plan);
      for (const day of next) {
        d.visits.push(makeVisit(d, property, {
          ownerId: user.id, propertyId: property.id, kind: "inspection", planId, scheduledFor: day, slot,
          subscriptionId: plan.id, usesPlan: true, status: firstStatus,
          lines: [{ k: `${planName(planId)} inspection`, note: "included in your plan · booked for you", v: 0 }],
        }));
      }
      pushEvent(d, {
        ownerId: user.id, propertyId: property.id, visitId: v.id, type: "plan.started",
        title: `${planName(planId)} booked — the year is planned`,
        body: `${property.label} · first visit ${fmtDayDate(scheduledFor)}, then ${next.map((x) => fmtDayDate(x)).join(", ")} · 25% now, the rest when the first report is ready`,
        href: "/app/plan",
      });
    }
  });

  revalidatePath("/app", "layout");
  redirect(`/app/visits/${visitId}?new=1${advance ? "&pay=1" : ""}`);
}

/* ── changing a booking ──────────────────────────────────────── */

/** "Move or cancel free until the day before" — enforced, not just said.
    A visit whose day has already gone by with nobody coming can always be
    moved or cancelled: that was not the owner's doing. */
function changeBlocked(v: Visit): string | null {
  if (!["unpaid", "scheduled", "assigned"].includes(v.status)) return "This visit can no longer be changed — it has already started.";
  /* On the day a visit is fixed — unless we are the ones who missed it. */
  if (v.scheduledFor === todayKey() && !v.missedAt) return "The visit is today. On the day itself a visit can no longer be moved or cancelled — the inspector is already committed to it.";
  return null;
}

export async function cancelVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const d0 = await db();
  const v0 = d0.visits.find((x) => x.id === id && x.ownerId === user.id);
  if (!v0) return { ok: false, error: "We could not find that visit." };
  const blocked = changeBlocked(v0);
  if (blocked) return { ok: false, error: blocked };

  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id)!;
    cancelVisitIn(d, v, "cancelled by you");
  });
  revalidatePath("/app", "layout");
  await refundOwed(user.id, id);
  redirect(`/app/visits/${id}?cancelled=1`);
}

export async function rescheduleVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const date = s(fd, "scheduledFor", 12);
  const slot = s(fd, "slot", 40);
  const d0 = await db();
  const v0 = d0.visits.find((x) => x.id === id && x.ownerId === user.id);
  if (!v0) return { ok: false, error: "We could not find that visit." };
  const blocked = changeBlocked(v0);
  if (blocked) return { ok: false, error: blocked };
  if (!isBookable(date)) return { ok: false, error: "Pick a day from the calendar — at least two clear days from today." };
  if (!SLOTS.includes(slot)) return { ok: false, error: "Pick a time window." };
  if (date === v0.scheduledFor && slot === v0.slot) return { ok: false, error: "That is the day and window it is already booked for." };

  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id)!;
    const p = d.properties.find((x) => x.id === v.propertyId);
    const hadInspector = !!v.inspectorId;
    v.scheduledFor = date;
    v.slot = slot;
    v.missedAt = null;
    /* Whoever claimed it claimed that day. The new day goes back on the
       board for whoever can make it — unless the advance is still unpaid,
       in which case it stays off the board until it is. */
    if (v.status !== "unpaid") v.status = "scheduled";
    v.inspectorId = "";
    v.claimedAt = null;
    v.otpTries = 0;
    pushEvent(d, {
      ownerId: user.id, propertyId: v.propertyId, visitId: id, type: "visit.moved",
      title: "Visit moved",
      body: `${p?.label ?? "Property"} · now ${fmtDayDate(date)} · ${slot}${hadInspector ? " — we are assigning an inspector for the new day" : ""}`,
      href: `/app/visits/${id}`,
    });
  });
  revalidatePath("/app", "layout");
  return { ok: true, message: `Moved to ${fmtDayDate(date)} · ${slot}.` };
}

/* ── decisions on a report ───────────────────────────────────── */

export async function decideIssue(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const approve = s(fd, "decision", 10) === "approve";
  const d0 = await db();
  const iss0 = d0.issues.find((i) => i.id === id && i.ownerId === user.id);
  if (!iss0) return { ok: false, error: "We could not find that issue." };
  if (iss0.decision !== "pending") return { ok: false, error: "This one is already decided or closed." };
  const refusal = liveRefusal(d0, iss0);
  if (refusal) return { ok: false, error: refusal };
  if (!isLive(iss0)) {
    const rep0 = d0.reports.find((r) => r.id === iss0.reportId);
    if (!rep0 || rep0.heldForReview) return { ok: false, error: "We could not find that issue." };
    if (balanceDue(d0, iss0.visitId)) return { ok: false, error: "Pay for the report first — then you can decide on what it found." };
  }
  if (approve && !iss0.quote) return { ok: false, error: "There is no quote on this yet — nothing can be approved until you can see the price." };
  /* "Approve, or decline with a reason" — the reason is kept with the decision. */
  const reason = s(fd, "reason", 400);
  if (!approve && reason.length < 4) return { ok: false, error: "Say why in a few words — it stays on record with your decision." };

  const ok = await mutate((d) => {
    const iss = d.issues.find((i) => i.id === id)!;
    const visit = d.visits.find((v) => v.id === iss.visitId);
    const sub = visit?.subscriptionId ? d.subscriptions.find((x) => x.id === visit.subscriptionId) ?? null : liveSub(d.subscriptions, iss.propertyId);
    /* The same function the card used to show the price — so the bill is
       exactly the number on the button. */
    const bill = repairBill(iss, { founding: visit?.founding === true, sub });

    if (approve) {
      /* Approving something that costs money is paying for it — that
         goes through the checkout, not through here. */
      if (!bill || bill.payable > 0) return false;
      approveIssueIn(d, iss, { covered: bill.covered, payable: 0, feeWaived: bill.feeWaived, feeCovered: bill.feeCovered });
      return true;
    }

    iss.decision = "declined";
    iss.decidedAt = now();
    iss.declineReason = reason;
    pushEvent(d, {
      ownerId: user.id, propertyId: iss.propertyId, visitId: iss.visitId,
      type: "issue.declined", title: "You declined a repair", body: `${iss.title} · ${iss.ref} · “${reason}” — nothing scheduled, nobody sent`,
      href: `/app/reports/${iss.reportId}#${iss.id}`,
    });
    closeIfSettled(d, iss.visitId);
    return true;
  });
  if (!ok) return { ok: false, error: "This repair is paid when you approve it — use the pay button." };

  revalidatePath("/app", "layout");
  return { ok: true };
}

/** The owner says when the approved repair can happen. Ops then confirms
    the pro for that day. */
export async function scheduleRepair(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const date = s(fd, "scheduledFor", 12);
  const slot = s(fd, "slot", 40);
  if (!isBookable(date)) return { ok: false, error: "Pick a day from the calendar — at least two clear days from today." };
  if (!SLOTS.includes(slot)) return { ok: false, error: "Pick a time window." };

  const ok = await mutate((d) => {
    const iss = d.issues.find((i) => i.id === id && i.ownerId === user.id);
    if (!iss?.repair || !["requested", "assigned"].includes(iss.repair.status)) return false;
    const p = d.properties.find((x) => x.id === iss.propertyId);
    iss.repair.scheduledFor = date;
    iss.repair.slot = slot;
    iss.repair.status = "requested";
    pushEvent(d, {
      ownerId: user.id, propertyId: iss.propertyId, visitId: iss.visitId, type: "repair.scheduled",
      title: "Repair day chosen",
      body: `${iss.title} · ${p?.label ?? ""} · ${fmtDayDate(date)} · ${slot} — we confirm the pro and send an inspector to be there`,
      href: `/app/reports/${iss.reportId}#${iss.id}`,
    });
    return true;
  });
  if (!ok) return { ok: false, error: "This repair can no longer be moved — the work has started." };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Day saved." };
}

/** The owner rates a finished repair — the site promises "rate the
    provider when it's done". Once per repair. */
export async function rateRepair(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const stars = Math.round(n(fd, "stars"));
  if (stars < 1 || stars > 5) return { ok: false, error: "Pick one to five stars." };
  const ok = await mutate((d) => {
    const iss = d.issues.find((i) => i.id === id && i.ownerId === user.id);
    if (!iss?.repair || iss.repair.status !== "completed" || iss.repair.rating) return false;
    iss.repair.rating = { stars, note: s(fd, "note", 400), at: now() };
    pushEvent(d, {
      ownerId: user.id, propertyId: iss.propertyId, visitId: iss.visitId, type: "repair.completed",
      title: `You rated the repair ${stars}/5`, body: `${iss.title} · ${iss.repair.providerName}`,
      href: `/app/reports/${iss.reportId}#${iss.id}`,
    });
    return true;
  });
  if (!ok) return { ok: false, error: "This repair has already been rated." };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Thank you — it goes on the provider's record." };
}

export async function markReportRead(fd: FormData) {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  await mutate((d) => {
    const r = d.reports.find((x) => x.id === id && x.ownerId === user.id && !x.heldForReview);
    if (!r) return;
    if (!r.readAt) r.readAt = now();
    for (const e of d.events) if (e.ownerId === user.id && e.href.includes(id) && !e.readAt) e.readAt = now();
    closeIfSettled(d, r.visitId);
  });
  revalidatePath("/app", "layout");
}

export async function markAllRead() {
  const user = await requireOwner();
  await mutate((d) => { for (const e of d.events) if (e.ownerId === user.id && !e.readAt) e.readAt = now(); });
  revalidatePath("/app", "layout");
}

/* ── after the visit ─────────────────────────────────────────── */

export async function rateVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const stars = Math.round(n(fd, "stars"));
  if (stars < 1 || stars > 5) return { ok: false, error: "Pick one to five stars." };
  const ok = await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.ownerId === user.id);
    if (!v || !["ready", "closed"].includes(v.status) || v.rating) return false;
    v.rating = { stars, note: s(fd, "note", 400), at: now() };
    const ins = d.inspectors.find((i) => i.id === v.inspectorId);
    if (ins) {
      /* A running average over everything they have walked. */
      ins.rating = Math.round(((ins.rating * ins.visits + stars) / (ins.visits + 1)) * 10) / 10;
      ins.visits += 1;
    }
    return true;
  });
  if (!ok) return { ok: false, error: "This visit has already been rated." };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Thank you — it goes on their record." };
}

export async function openTicket(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const topic = s(fd, "topic", 60);
  const body = s(fd, "body", 2000);
  if (!(TICKET_TOPICS as readonly string[]).includes(topic)) return { ok: false, error: "Pick what it is about." };
  if (body.length < 10) return { ok: false, error: "Tell us a little more — a sentence or two." };

  const d0 = await db();
  const visit = d0.visits.find((v) => v.id === s(fd, "visitId", 60) && v.ownerId === user.id) ?? null;
  const reportId = visit?.reportId && d0.reports.some((r) => r.id === visit.reportId && !r.heldForReview) ? visit.reportId : null;

  const ref = await mutate((d) => {
    const t = {
      id: uid(), ref: ticketRef(d), ownerId: user.id, propertyId: visit?.propertyId ?? null, visitId: visit?.id ?? null,
      reportId, topic, body, status: "open" as const, reply: "", repliedAt: null, createdAt: now(),
    };
    d.tickets.push(t);
    pushEvent(d, {
      ownerId: user.id, propertyId: t.propertyId, visitId: t.visitId, type: "ticket.opened",
      title: `We have your message · ${t.ref}`,
      body: `${topic}${visit ? ` · ${visit.ref}` : ""} — a person reads it and replies here, usually the same day`,
      href: "/app/help#messages",
    });
    return t.ref;
  });
  revalidatePath("/app", "layout");
  return { ok: true, message: `Sent — ${ref}. The reply lands in Help and in Activity.` };
}

/** A private read-only link to one report, for family. Turning it off
    kills the link at once. */
export async function shareReport(fd: FormData) {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const on = s(fd, "on", 4) !== "0";
  await mutate((d) => {
    const r = d.reports.find((x) => x.id === id && x.ownerId === user.id && !x.heldForReview);
    if (!r) return;
    r.shareToken = on ? randomBytes(24).toString("base64url") : null;
    if (on) pushEvent(d, { ownerId: user.id, propertyId: r.propertyId, visitId: r.visitId, type: "report.shared", title: "Share link made", body: `${r.ref} · anyone with the link can read it until you turn it off`, href: `/app/reports/${r.id}` });
  });
  revalidatePath(`/app/reports/${id}`);
}

/* ── plans ───────────────────────────────────────────────────── */

export async function upgradePlan(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const d0 = await db();
  const sub = d0.subscriptions.find((x) => x.id === id && x.ownerId === user.id);
  const property = sub && d0.properties.find((p) => p.id === sub.propertyId);
  if (!sub || !property) return { ok: false, error: "We could not find that plan." };
  const st = effectiveStatus(sub);
  if (sub.planId !== "care" || !["pending", "active"].includes(st)) return { ok: false, error: "Only a running Care plan can move to Care+." };

  const from = planPriceAt("care", property.size);
  const to = planPriceAt("care-plus", property.size);
  const diff = upgradePrice(from, to, sub);

  await mutate((d) => {
    const x = d.subscriptions.find((y) => y.id === id)!;
    x.planId = "care-plus";
    x.servicesTotal = planAllowance("care-plus").services;
    x.amountInr += to - from;
    for (const v of d.visits.filter((q) => q.subscriptionId === x.id && ["unpaid", "scheduled", "assigned"].includes(q.status))) {
      v.planId = "care-plus";
      /* the plan's own bill, raised with its first visit, is now Care+ */
      if (v.id === x.startedByVisitId && st === "pending") {
        v.amountInr += to - from;
        v.lines = v.lines.map((l, i) => (i === 0 ? { ...l, k: "Care+", v: l.v + (to - from) } : l));
      } else {
        v.lines = v.lines.map((l, i) => (i === 0 ? { ...l, k: "Care+ inspection" } : l));
      }
    }
    if (diff > 0) {
      d.invoices.push({
        id: uid(), ref: invoiceRef(d), ownerId: user.id, propertyId: x.propertyId, visitId: null, issueId: null, subscriptionId: x.id,
        title: `Care → Care+ · ${property.label} · rest of the plan year`, amountInr: diff, status: "due", method: "", createdAt: now(),
      });
    }
    pushEvent(d, {
      ownerId: user.id, propertyId: x.propertyId, type: "plan.upgraded", title: "Moved to Care+",
      body: `${property.label} · repair cover and 2 maintenance services from today${diff ? ` · ${inr(diff)} for the rest of the year` : " · billed with the first visit"}`,
      href: "/app/plan",
    });
  });
  revalidatePath("/app", "layout");
  return { ok: true, message: diff ? `Done — ${inr(diff)} for the rest of this plan year is on your bills.` : "Done — the plan is billed as Care+ with its first visit." };
}

export async function setRenewal(fd: FormData) {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const on = s(fd, "on", 4) === "1";
  await mutate((d) => {
    const x = d.subscriptions.find((y) => y.id === id && y.ownerId === user.id);
    if (!x || effectiveStatus(x) !== "active") return;
    x.autoRenew = on;
    const p = d.properties.find((q) => q.id === x.propertyId);
    pushEvent(d, {
      ownerId: user.id, propertyId: x.propertyId, type: "plan.renewal",
      title: on ? `${planName(x.planId)} will renew` : `${planName(x.planId)} will not renew`,
      body: `${p?.label ?? ""} · ${on ? "renews" : "ends"} ${x.renewsAt ?? ""}${on ? "" : " — everything left on it stays yours until then"}`,
      href: "/app/plan",
    });
  });
  revalidatePath("/app", "layout");
}

/** A plan that has not started yet can simply be called off: its first
    visit and the rest of its rhythm are cancelled, and nothing is billed. */
export async function cancelPlan(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireOwner();
  const id = s(fd, "id", 60);
  const d0 = await db();
  const sub = d0.subscriptions.find((x) => x.id === id && x.ownerId === user.id);
  if (!sub || sub.status !== "pending") return { ok: false, error: "Only a plan that has not started can be cancelled. A running one can be set not to renew." };
  const first = d0.visits.find((v) => v.id === sub.startedByVisitId);
  if (first && first.scheduledFor === todayKey() && ["unpaid", "scheduled", "assigned"].includes(first.status)) {
    return { ok: false, error: "Its first visit is today, and a visit can no longer be cancelled on the day." };
  }
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === sub.startedByVisitId);
    if (v && ["unpaid", "scheduled", "assigned"].includes(v.status)) cancelVisitIn(d, v, "plan cancelled before it started");
    const x = d.subscriptions.find((y) => y.id === id)!;
    if (x.status === "pending") {
      x.status = "cancelled";
      for (const o of d.visits.filter((q) => q.subscriptionId === x.id && ["unpaid", "scheduled", "assigned"].includes(q.status))) cancelVisitIn(d, o, "plan cancelled");
    }
    pushEvent(d, { ownerId: user.id, propertyId: x.propertyId, type: "plan.cancelled", title: `${planName(x.planId)} cancelled`, body: "It had not started — any advance paid is refunded", href: "/app/plan" });
  });
  if (sub.startedByVisitId) await refundOwed(user.id, sub.startedByVisitId);
  revalidatePath("/app", "layout");
  const paid = d0.invoices.some((i) => i.visitId === sub.startedByVisitId && i.stage === "advance" && i.status === "paid");
  return { ok: true, message: paid ? "Cancelled. Your advance is on its way back to you." : "Cancelled. Nothing was charged." };
}
