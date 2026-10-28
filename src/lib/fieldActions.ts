"use server";

/* ════════════════════════════════════════════════════════════════
   Everything the inspector app writes.

   The rules an inspector agreed to when they applied are enforced
   here, not in the interface: no entry without the owner's OTP, a
   photo on anything flagged, and no submitting a visit with a room
   left unanswered. A rule that only lives in a disabled button is
   not a rule.
   ════════════════════════════════════════════════════════════════ */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireInspector } from "@/lib/auth";
import { db, mutate, now, uid, reportRef, issueRef } from "@/lib/store";
import { inspectorFor, claimBlock, onBoardWindow } from "@/lib/field";
import { claimRefusal, freeReleaseUntil, holdForDeposit, penalise, UNDER_WAY } from "@/lib/jobs";
import { afterOpen, afterOpensAt, blocksFor, cleanOf, countItems, draftFrom, scoreOf, outstanding } from "@/lib/checklist";
import { checkInWords, distanceKm, fmtLatLng, PIN_FROM_VISIT_MAX_ACCURACY_M, tooFar } from "@/lib/geo";
import { inReach } from "@/lib/city";
import { fmtDayDate, fmtTime, todayKey } from "@/lib/format";
import { pushEvent } from "@/lib/events";
import { deliverReport } from "@/lib/lifecycle";
import { discard, keepImage, readVideo } from "@/lib/media";
import { includedMinutes, overtimeFor } from "@/lib/payout";
import { coverFor, urbanCompanyQuote } from "@/lib/repair";
import { cancelLiveRepair, closeLive, notReadyToSend, sendLive } from "@/lib/liveRepairs";
import { refundOwed } from "@/lib/refunds";
import { initialsOf } from "@/lib/roster";
import type { DraftRoom, ItemState, Photo, ReportRoom } from "@/lib/types";

export type FieldState = { ok: boolean; error?: string };

const str = (fd: FormData, k: string, max = 400) => String(fd.get(k) ?? "").trim().slice(0, max);
const num = (fd: FormData, k: string) => {
  const raw = fd.get(k);
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const MAX_PHOTO_CHARS = 80_000;   // ~60 KB of base64
const MAX_PHOTOS = 80;
/** A reason has to be a reason, not "ok". */
const MIN_REASON = 8;
/** A four-digit code is ten thousand guesses. Five wrong ones locks it. */
const MAX_OTP_TRIES = 5;

async function me() {
  const user = await requireInspector();
  const ins = await inspectorFor(user.id);
  return { user, ins };
}

/* ── the board ───────────────────────────────────────────────── */

export async function claimJob(fd: FormData) {
  const { ins } = await me();
  if (!ins || claimBlock(ins)) return;
  const id = str(fd, "id", 60);

  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id);
    if (!v || v.status !== "scheduled" || v.inspectorId || !onBoardWindow(v)) return;
    /* Five at most (two until ₹1,500 of deposit), three a day, one per
       window — checked against the store rather than whatever the page
       rendered a moment ago. */
    if (claimRefusal(d, d.inspectors.find((x) => x.id === ins.id) ?? ins, v)) return;
    const p = d.properties.find((x) => x.id === v.propertyId);
    if (!p || !inReach(p, ins.city)) return;

    v.inspectorId = ins.id;
    v.claimedAt = now();
    v.status = "assigned";
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.assigned",
      title: `${ins.name} is assigned`, body: `${p.label} · ${ins.bg} · ${ins.visits} visits · rated ${ins.rating}`,
      href: `/app/visits/${v.id}`,
    });
  });
  revalidatePath("/field", "layout");
  revalidatePath("/app", "layout");
  redirect(`/field/visit/${id}`);
}

export async function releaseJob(fd: FormData) {
  const { ins } = await me();
  if (!ins) return;
  const id = str(fd, "id", 60);
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.inspectorId === ins.id);
    /* Only before they have set off. Once they are on the way — and
       certainly once the OTP is used — walking away is a phone call to
       ops, not a button. */
    if (!v || v.status !== "assigned") return;
    /* Free until 24 hours before the window; after that it costs. */
    const late = Date.now() >= freeReleaseUntil(v);
    const me = d.inspectors.find((x) => x.id === ins.id);
    if (late && me) penalise(d, me, v, "late_release");
    v.inspectorId = "";
    v.claimedAt = null;
    v.status = "scheduled";
    const p = d.properties.find((x) => x.id === v.propertyId);
    /* The owner was told who was coming. They are told this too. */
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.assigned",
      title: `${ins.name} can no longer make it`,
      body: `${p?.label ?? "Your property"} · the visit stays booked — we are finding another verified inspector`,
      href: `/app/visits/${v.id}`,
    });
  });
  revalidatePath("/field", "layout");
  revalidatePath("/app", "layout");
  redirect("/field/jobs");
}

/** Another job already under way — only one at a time. */
const busyElsewhere = (visits: { id: string; inspectorId: string; status: string }[], insId: string, id: string) =>
  visits.some((x) => x.inspectorId === insId && x.id !== id && (UNDER_WAY as string[]).includes(x.status));
const ONE_AT_A_TIME = "Finish the job you are on first — one house at a time.";

/** The visit has to happen on the day it was booked for. */
const notToday = (scheduledFor: string) =>
  scheduledFor !== todayKey()
    ? scheduledFor > todayKey()
      ? "This visit is booked for a later day. Start it on the day."
      : "This visit's day has gone. Ops will move it with the owner — do not go in."
    : null;

export async function startTravel(_prev: FieldState, fd: FormData): Promise<FieldState> {
  const { ins } = await me();
  if (!ins) return { ok: false, error: "Your inspector profile is not set up yet." };
  const id = str(fd, "id", 60);
  const d0 = await db();
  const v0 = d0.visits.find((x) => x.id === id && x.inspectorId === ins.id);
  if (!v0 || v0.status !== "assigned") return { ok: false, error: "This visit is not waiting to start." };
  const day = notToday(v0.scheduledFor);
  if (day) return { ok: false, error: day };
  if (busyElsewhere(d0.visits, ins.id, id)) return { ok: false, error: ONE_AT_A_TIME };

  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id)!;
    v.status = "en_route";
    const p = d.properties.find((x) => x.id === v.propertyId);
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.en_route",
      title: `${ins.name} is on the way`, body: `${p?.label ?? "Your property"} · left at ${fmtTime(now())} IST · have your entry code ready`,
      href: `/app/visits/${v.id}`,
    });
  });
  revalidatePath("/field", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

/* ── the door ────────────────────────────────────────────────── */

export async function checkIn(_prev: FieldState, fd: FormData): Promise<FieldState> {
  const { ins } = await me();
  if (!ins) return { ok: false, error: "Your inspector profile is not set up yet." };
  const id = str(fd, "id", 60);
  const otp = str(fd, "otp", 8).replace(/\D/g, "");
  const lat = num(fd, "lat");
  const lng = num(fd, "lng");
  const accuracy = num(fd, "accuracy");
  const accuracyM = accuracy !== null && accuracy >= 0 ? Math.round(accuracy) : null;
  const door = str(fd, "doorPhoto", MAX_PHOTO_CHARS);
  const reason = str(fd, "reason", 300);

  const d0 = await db();
  const v0 = d0.visits.find((x) => x.id === id && x.inspectorId === ins.id);
  if (!v0) return { ok: false, error: "That visit is not yours." };
  if (!["assigned", "en_route"].includes(v0.status)) return { ok: false, error: "This visit has already started." };
  const day = notToday(v0.scheduledFor);
  if (day) return { ok: false, error: day };
  if (busyElsewhere(d0.visits, ins.id, id)) return { ok: false, error: ONE_AT_A_TIME };

  if ((v0.otpTries ?? 0) >= MAX_OTP_TRIES) return { ok: false, error: "Too many wrong codes on this visit. Call ops — they will check with the owner and unlock it." };
  if (otp !== v0.otp) {
    const tries = await mutate((d) => {
      const v = d.visits.find((x) => x.id === id)!;
      v.otpTries = (v.otpTries ?? 0) + 1;
      return v.otpTries;
    });
    const left = MAX_OTP_TRIES - tries;
    return { ok: false, error: left > 0 ? `That is not the code the owner has. Ask them to read it again — ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong codes on this visit. Call ops — they will check with the owner and unlock it." };
  }
  if (!door.startsWith("data:image/")) return { ok: false, error: "Photograph the front door before you go in." };

  const property = d0.properties.find((p) => p.id === v0.propertyId)!;
  const pin = property.pin;
  const located = lat !== null && lng !== null;
  /* Measured only against a spot somebody actually marked. Without one
     the location is recorded as evidence, and nobody is held to it. */
  const distanceM = located && pin ? Math.round(distanceKm({ lat: lat!, lng: lng! }, pin) * 1000) : -1;

  /* No location, or a long way off: allowed, but only with a reason — and
     the reason goes on the report, where the owner and ops can read it. */
  if (!located && reason.length < MIN_REASON) {
    return { ok: false, error: "We could not read your location. Turn GPS on — or, if there is no signal here, say why in a few words." };
  }
  if (tooFar(distanceM, accuracyM) && reason.length < MIN_REASON) {
    return { ok: false, error: `You are about ${distanceM} m from the pin the owner has. If that is right, say why before you go in.` };
  }

  const doorPhoto = await keepImage(door);
  if (!doorPhoto) return { ok: false, error: "That photo did not come through. Take it again." };

  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id)!;
    v.status = "on_site";
    v.startedAt = now();
    v.checkIn = { at: now(), lat, lng, accuracyM, distanceM, doorPhoto: photo(doorPhoto, lat, lng), note: reason };
    /* Nobody had marked the spot. The inspector is at the gate with the
       owner's code, so where they stand is the best pin there is — but
       it is the owner's property, so it waits for them to agree. */
    const p = d.properties.find((x) => x.id === v.propertyId)!;
    if (!p.pin && located && accuracyM !== null && accuracyM <= PIN_FROM_VISIT_MAX_ACCURACY_M) {
      p.pin = { lat: lat!, lng: lng!, accuracyM, source: "inspector", at: now(), confirmedAt: null };
      pushEvent(d, {
        ownerId: v.ownerId, propertyId: p.id, visitId: v.id, type: "property.pinned",
        title: `Is this where ${p.label} is?`, body: `${ins.name} marked the spot at the gate. Check it — every visit is measured from it.`,
        href: `/app/properties/${p.id}`,
      });
    }
    /* The checklist is generated from the rooms the owner registered and
       the cars they booked, so nobody can quietly walk fewer than that —
       and with a clean booked, every room the crew cleans waits for its
       before and after photos. */
    const withClean = !!cleanOf(v);
    v.draft = blocksFor(property, v).map((b) => draftFrom(b, withClean));
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.started",
      title: `${ins.name} is on site`, body: `${property.label} · entered at ${fmtTime(now())} IST with your code`,
      href: `/app/visits/${v.id}`,
    });
  });
  revalidatePath("/field", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

/* ── the checklist ───────────────────────────────────────────── */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The browser names each photo, so a photo removed a second after it was
    taken is the same photo on both sides. */
const photo = (thumb: string, lat: number | null, lng: number | null, id?: string): Photo => ({
  id: id && UUID.test(id) ? id : uid(), thumb: thumb.slice(0, MAX_PHOTO_CHARS), at: now(), lat, lng,
});

async function editDraft(id: string, fn: (draft: DraftRoom[]) => void) {
  const { ins } = await me();
  if (!ins) return false;
  const ok = await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.inspectorId === ins.id);
    if (!v || v.status !== "on_site" || !v.draft) return false;
    fn(v.draft);
    return true;
  });
  revalidatePath(`/field/visit/${id}`);
  return ok;
}

/* Each of these returns whether the store took it, so the checklist can
   tell an inspector the moment a tap did not save. */

export async function setItem(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const state = str(fd, "state", 8) as ItemState;
  if (!["pass", "attn", "fail"].includes(state)) return false;

  return editDraft(id, (draft) => {
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    /* once sent, the owner is deciding on exactly what they were sent */
    if (it && !it.issueId) it.s = state;
  });
}

export async function setNote(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const note = str(fd, "note", 600);
  return editDraft(id, (draft) => {
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    if (it) it.note = note;
  });
}

/** The Urban Company price for fixing a flagged item — the service as it
    is listed there, what the work costs today, any parts, and whether the
    job is outside Care+ by its terms. Blank clears it. */
export async function setQuote(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const service = str(fd, "service", 80);
  const price = Math.round(num(fd, "price") ?? 0);
  const parts = Math.round(num(fd, "parts") ?? 0);
  const excluded = str(fd, "excluded", 4) === "1";
  const slotToday = str(fd, "slotToday", 4) === "1";
  if (price < 0 || price > 500_000 || parts < 0 || parts > 500_000) return false;
  return editDraft(id, (draft) => {
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    if (it && !it.issueId) it.quote = service && price > 0 ? { service, price, parts, excluded, slotToday } : null;
  });
}

export async function addPhoto(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const thumb = str(fd, "thumb", MAX_PHOTO_CHARS);
  const photoId = str(fd, "photoId", 60);
  const lat = num(fd, "lat");
  const lng = num(fd, "lng");
  if (!thumb.startsWith("data:image/")) return false;
  /* stored only for somebody who may be writing a checklist at all */
  const { ins } = await me();
  if (!ins) return false;
  const kept = await keepImage(thumb);
  if (!kept) return false;

  let full = false;
  const ok = await editDraft(id, (draft) => {
    const total = draft.reduce((n, r) => n + r.items.reduce((m, i) => m + i.photos.length, 0), 0);
    if (total >= MAX_PHOTOS) { full = true; return; }
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    if (it && !it.photos.some((p) => p.id === photoId)) it.photos.push(photo(kept, lat, lng, photoId));
  });
  return ok && !full;
}

export async function dropPhoto(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const photoId = str(fd, "photoId", 60);
  return editDraft(id, (draft) => {
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    if (it) it.photos = it.photos.filter((x) => x.id !== photoId);
  });
}

/* ── a clean on the visit ────────────────────────────────────── */

/** One photo of a room the crew cleans — before they start, or after
    they finish, from the same spot. The rules are checked here, not in
    the screen: no before photo once the crew is working, and no after
    photo until they have worked long enough to have done the job. */
export async function setCleanPhoto(fd: FormData): Promise<FieldState> {
  const { ins } = await me();
  if (!ins) return { ok: false, error: "Your inspector profile is not set up yet." };
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const which = str(fd, "which", 8);
  const thumb = str(fd, "thumb", MAX_PHOTO_CHARS);
  const photoId = str(fd, "photoId", 60);
  if (which !== "before" && which !== "after") return { ok: false, error: "Before or after?" };
  if (!thumb.startsWith("data:image/")) return { ok: false, error: "That photo did not come through. Take it again." };
  const kept = await keepImage(thumb);
  if (!kept) return { ok: false, error: "That photo did not come through. Take it again." };

  const error = await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.inspectorId === ins.id);
    if (!v || v.status !== "on_site" || !v.draft) return "This visit is not open.";
    const r = v.draft.find((x) => x.name === room);
    if (!r || r.before === undefined) return "The crew does not clean that room.";
    const shot = photo(kept, num(fd, "lat"), num(fd, "lng"), photoId);
    if (which === "before") {
      if (v.crewStartedAt) return "The crew has started — the before photos are closed.";
      r.before = shot;
      return null;
    }
    const size = d.properties.find((x) => x.id === v.propertyId)?.size ?? "2";
    if (!v.crewStartedAt) return "Take every before photo and let the crew start first.";
    if (!afterOpen(v, size)) return `After photos open at ${fmtTime(new Date(afterOpensAt(v, size)!).toISOString())} — stay with the crew until then.`;
    r.after = shot;
    return null;
  });
  revalidatePath(`/field/visit/${id}`);
  return error ? { ok: false, error } : { ok: true };
}

/** The crew starts once every room is photographed as it was. */
export async function startCrew(_prev: FieldState, fd: FormData): Promise<FieldState> {
  const { ins } = await me();
  if (!ins) return { ok: false, error: "Your inspector profile is not set up yet." };
  const id = str(fd, "id", 60);
  const error = await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.inspectorId === ins.id);
    if (!v || v.status !== "on_site" || !v.draft) return "This visit is not open.";
    if (v.crewStartedAt) return null;
    const left = v.draft.filter((r) => r.before === null).map((r) => r.name);
    if (left.length) return `Before photos still to take: ${left.join(", ")}.`;
    v.crewStartedAt = now();
    const p = d.properties.find((x) => x.id === v.propertyId);
    pushEvent(d, {
      ownerId: v.ownerId, propertyId: v.propertyId, visitId: v.id, type: "visit.started",
      title: "The cleaning crew has started",
      body: `${p?.label ?? "Your property"} · ${fmtTime(now())} IST · every room photographed first, ${ins.name} staying with them`,
      href: `/app/visits/${v.id}`,
    });
    return null;
  });
  revalidatePath(`/field/visit/${id}`);
  revalidatePath("/app", "layout");
  return error ? { ok: false, error } : { ok: true };
}

/* ── clips ───────────────────────────────────────────────────── */

/** Enough to show a problem from two sides; more is a re-shoot. */
const MAX_ITEM_VIDEOS = 3;
const MAX_VIDEO_FIELD = 100_000;

/** The room's walkthrough. A re-shoot replaces it and the old file goes. */
export async function setRoomVideo(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const video = await readVideo(str(fd, "video", MAX_VIDEO_FIELD), `visits/${id}/`);
  if (!video) return false;
  const replaced = { key: "" };
  const ok = await editDraft(id, (draft) => {
    const r = draft.find((x) => x.name === room);
    if (!r) return;
    replaced.key = r.video?.key ?? "";
    r.video = video;
  });
  if (ok && replaced.key && replaced.key !== video.key) await discard(replaced.key);
  return ok;
}

/** A clip of something flagged — the owner may understand a drip or a
    rattle better moving than still. */
export async function addItemVideo(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const video = await readVideo(str(fd, "video", MAX_VIDEO_FIELD), `visits/${id}/`);
  if (!video) return false;
  let full = false;
  const ok = await editDraft(id, (draft) => {
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    if (!it) return;
    if (it.videos.length >= MAX_ITEM_VIDEOS) { full = true; return; }
    if (!it.videos.some((v) => v.key === video.key)) it.videos.push(video);
  });
  if (full) await discard(video.key);
  return ok && !full;
}

export async function dropItemVideo(fd: FormData) {
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  const key = str(fd, "key", 200);
  const ok = await editDraft(id, (draft) => {
    const it = draft.find((r) => r.name === room)?.items.find((x) => x.t === item);
    if (it) it.videos = it.videos.filter((v) => v.key !== key);
  });
  if (ok && key.startsWith(`visits/${id}/`)) await discard(key);
  return ok;
}

/* ── submitting ──────────────────────────────────────────────── */

export async function submitVisit(_prev: FieldState, fd: FormData): Promise<FieldState> {
  const { ins } = await me();
  if (!ins) return { ok: false, error: "Your inspector profile is not set up yet." };
  const id = str(fd, "id", 60);
  const summary = str(fd, "summary", 1200);

  const d0 = await db();
  const v0 = d0.visits.find((x) => x.id === id && x.inspectorId === ins.id);
  if (!v0 || v0.status !== "on_site" || !v0.draft) return { ok: false, error: "This visit is not open." };
  if (summary.length < 40) return { ok: false, error: "Write a few lines for the owner — what you found, in your words." };

  const missing = outstanding(v0.draft);
  if (missing.length) return { ok: false, error: `${missing.length} thing${missing.length > 1 ? "s" : ""} still to finish. ${missing[0]}` };

  /* A repair approved on this visit is either done or put to another day
     before the visit closes — never left hanging. */
  const midway = d0.issues.find((i) => i.visitId === id && i.repair?.status === "in_progress");
  if (midway) return { ok: false, error: `"${midway.title}" is still being repaired. Record the after photo, or mark it as not finished today.` };

  /* The visit closes only with the second code — from the owner, or
     whoever takes the keys back. */
  if ((v0.exitTries ?? 0) >= MAX_OTP_TRIES) return { ok: false, error: "Too many wrong completion codes. Call ops — they will check with the owner and unlock it." };
  const exit = str(fd, "exitCode", 8).replace(/\D/g, "");
  if (v0.exitCode && exit !== v0.exitCode) {
    const tries = await mutate((d) => {
      const v = d.visits.find((x) => x.id === id)!;
      v.exitTries = (v.exitTries ?? 0) + 1;
      return v.exitTries;
    });
    const left = MAX_OTP_TRIES - tries;
    return { ok: false, error: left > 0 ? `That is not the completion code. Ask the owner, or whoever takes the keys, to read it again — ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong completion codes. Call ops — they will check with the owner and unlock it." };
  }

  const reportId = uid();
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id)!;
    const draft = v.draft!;

    /* The photographs are the proof — they travel with every item into
       the report, and with every flag into the owner's decision. */
    const rooms: ReportRoom[] = draft.map((r) => ({
      name: r.name,
      variant: r.variant,
      dur: "",
      video: r.video,
      ...(r.before !== undefined ? { before: r.before, after: r.after ?? null } : {}),
      items: r.items.map((i) => ({
        t: i.t, s: i.s as ItemState,
        ...(i.note ? { note: i.note } : {}),
        ...(i.photos.length ? { photos: i.photos } : {}),
        ...(i.videos.length ? { videos: i.videos } : {}),
      })),
    }));
    const counts = countItems(rooms);

    /* Not active yet (trial, probation): a person reads it first. The
       report is written now either way — what changes is whether the
       owner can see it. */
    const held = ins.status !== "active";
    const ci = v.checkIn;

    d.reports.push({
      id: reportId, ref: reportRef(d), visitId: v.id, propertyId: v.propertyId, ownerId: v.ownerId,
      score: scoreOf(counts), counts, rooms, summary, inspectorId: ins.id,
      otpAt: ci ? fmtTime(ci.at) : "—",
      onSite: `${v.startedAt ? fmtTime(v.startedAt) : "—"} → ${fmtTime(now())}`,
      gps: ci && ci.lat !== null && ci.lng !== null
        ? `${fmtLatLng(ci.lat, ci.lng)} · ${checkInWords(ci).long}${ci.note ? ` — "${ci.note}"` : ""}`
        : `No GPS — "${ci?.note || "no reason given"}"`,
      videos: `${draft.filter((r) => r.video).length} of ${draft.length} rooms filmed`,
      doorPhoto: ci?.doorPhoto ?? null,
      publishedAt: now(), readAt: null, heldForReview: held, reviewedAt: null, shareToken: null,
    });

    /* Anything not a pass becomes a question for the owner, carrying the
       Urban Company price the inspector found for it, when they found one.
       Care+ cover "starts with your first inspection" — whatever that
       first report finds is quoted separately, so it is not eligible. */
    const sub = v.subscriptionId ? d.subscriptions.find((s) => s.id === v.subscriptionId) ?? null : null;
    const firstOfPlan = !!sub && sub.startedByVisitId === v.id;
    /* Live questions still open close with the visit; every live issue
       now belongs to this report. */
    for (const li of d.issues.filter((x) => x.visitId === v.id && x.sentAt)) {
      closeLive(d, li, "visit_closed");
      li.reportId = reportId;
    }
    for (const r of draft) {
      for (const i of r.items) {
        if (i.s === "pass" || !i.s || i.issueId) continue;
        const q = i.quote ? urbanCompanyQuote(i.quote.price, i.quote.service, i.quote.parts ?? 0) : null;
        /* outside the cover: the plan's first report, or work its terms exclude */
        const eligible = !firstOfPlan && !i.quote?.excluded;
        d.issues.push({
          id: uid(), ref: issueRef(d), reportId, visitId: v.id, propertyId: v.propertyId, ownerId: v.ownerId,
          room: r.name, title: i.t, severity: i.s, body: i.note, variant: r.variant, photos: i.photos, videos: i.videos,
          quote: q, quotedAt: q ? now() : null, coverEligible: eligible, coveredInr: q ? coverFor(q, sub, eligible) : 0,
          /* repairs are decided live, during the visit — anything not sent
             then is on the record, not up for a repair now */
          decision: "closed", closedWhy: "not_sent", decidedAt: now(), repair: null,
        });
      }
    }

    v.status = "submitted";
    v.endedAt = now();
    /* two hours on site are part of the job — two and a half on a 4 BHK and up */
    const home = d.properties.find((x) => x.id === v.propertyId);
    v.overtimeInr = home ? overtimeFor(v.startedAt, v.endedAt, includedMinutes(home, v.kind)) : 0;
    /* the deposit is built from pay, half of each job, not asked for in cash */
    const who = d.inspectors.find((x) => x.id === v.inspectorId);
    if (who) holdForDeposit(who, v);
    v.reportId = reportId;
    v.draft = null;

    if (!held) deliverReport(d, v.id);
  });

  revalidatePath("/field", "layout");
  revalidatePath("/app", "layout");
  revalidatePath("/ops", "layout");
  redirect(`/field/visit/${id}?done=1`);
}

/* ── live decisions ──────────────────────────────────────────── */

/** Send a flagged, priced item to the owner now. They have an hour. */
export async function sendIssue(_prev: FieldState, fd: FormData): Promise<FieldState> {
  const { ins } = await me();
  if (!ins) return { ok: false, error: "Your inspector profile is not set up yet." };
  const id = str(fd, "id", 60);
  const room = str(fd, "room", 80);
  const item = str(fd, "item", 120);
  let error: string | null = null;
  await mutate((d) => {
    const v = d.visits.find((x) => x.id === id && x.inspectorId === ins.id);
    if (!v || v.status !== "on_site" || !v.draft) { error = "This visit is not open."; return; }
    const r = v.draft.find((x) => x.name === room);
    const it = r?.items.find((x) => x.t === item);
    if (!r || !it) { error = "That item is not on this checklist."; return; }
    error = notReadyToSend(it);
    if (!error) sendLive(d, v, r, it);
  });
  if (error) return { ok: false, error };
  revalidatePath(`/field/visit/${id}`);
  revalidatePath("/app", "layout");
  return { ok: true };
}

/** The professional has reached the property — the two-hour clock stops. */
export async function proArrived(fd: FormData) {
  const { ins } = await me();
  if (!ins) return;
  const id = str(fd, "id", 60);
  await mutate((d) => {
    const iss = d.issues.find((i) => i.id === id);
    const v = iss && d.visits.find((x) => x.id === iss.visitId);
    if (!iss?.repair || !v || v.inspectorId !== ins.id || iss.repair.status !== "in_progress" || iss.repair.proArrivedAt) return;
    iss.repair.proArrivedAt = now();
  });
  revalidatePath("/field", "layout");
  revalidatePath("/app", "layout");
}

/** An approved repair that cannot be done on this visit. It is cancelled
    and the owner refunded in full — nobody comes back another day for it. */
export async function cancelRepair(fd: FormData) {
  const { ins } = await me();
  if (!ins) return;
  const id = str(fd, "id", 60);
  const why = str(fd, "why", 300) || "it could not be done on the visit";
  let owner = "", visit = "";
  await mutate((d) => {
    const iss = d.issues.find((i) => i.id === id);
    const v = iss && d.visits.find((x) => x.id === iss.visitId);
    if (!iss?.repair || !v || v.inspectorId !== ins.id || iss.repair.status !== "in_progress") return;
    cancelLiveRepair(d, iss, why);
    owner = iss.ownerId;
    visit = iss.visitId;
  });
  if (owner) await refundOwed(owner, visit);
  revalidatePath("/field", "layout");
  revalidatePath("/app", "layout");
}

/* ── repairs ─────────────────────────────────────────────────── */

/** The inspector who found it closes the repair: an after-photo from the
    camera, from the same spot as the before, and a line on what was
    done. It happens on the owner's chosen day, not before. */
export async function witnessRepair(_prev: FieldState, fd: FormData): Promise<FieldState> {
  const { ins } = await me();
  if (!ins) return { ok: false, error: "Your inspector profile is not set up yet." };
  const id = str(fd, "id", 60);
  const note = str(fd, "note", 800);
  const after = str(fd, "afterPhoto", MAX_PHOTO_CHARS);
  const lat = num(fd, "lat");
  const lng = num(fd, "lng");
  const clip = str(fd, "afterVideo", MAX_VIDEO_FIELD);
  const afterVideo = clip ? await readVideo(clip, `repairs/${id}/`) : null;

  const d0 = await db();
  const iss0 = d0.issues.find((i) => i.id === id);
  /* the inspector who wrote the report found it, whoever holds the visit now */
  const found = !!iss0 && (d0.reports.find((r) => r.id === iss0.reportId)?.inspectorId ?? d0.visits.find((v) => v.id === iss0.visitId)?.inspectorId) === ins.id;
  if (!iss0?.repair || !found) return { ok: false, error: "This repair is not yours." };
  if (iss0.repair.status === "completed" || iss0.repair.status === "cancelled") return { ok: false, error: "This repair is already closed." };
  if (!iss0.repair.scheduledFor) return { ok: false, error: "The owner has not picked a day for it yet." };
  if (iss0.repair.scheduledFor > todayKey()) return { ok: false, error: `This repair is on ${fmtDayDate(iss0.repair.scheduledFor)}. Take the after photo on the day.` };
  if (clip && !afterVideo) return { ok: false, error: "The after clip did not upload — record it again." };
  if (!after.startsWith("data:image/") && !afterVideo) return { ok: false, error: "Take an after photo or a clip — from the same spot as the first one." };
  if (note.length < 10) return { ok: false, error: "Say what was done, in a line — the owner reads this." };
  const afterKept = after.startsWith("data:image/") ? await keepImage(after) : "";
  if (!afterKept && !afterVideo) return { ok: false, error: "That photo did not come through. Take it again." };

  await mutate((d) => {
    const iss = d.issues.find((i) => i.id === id)!;
    const r = iss.repair!;
    r.status = "completed";
    r.completedAt = now();
    r.note = note;
    r.afterPhoto = afterKept ? photo(afterKept, lat, lng) : null;
    r.afterVideo = afterVideo;
    pushEvent(d, {
      ownerId: iss.ownerId, propertyId: iss.propertyId, visitId: iss.visitId, type: "repair.completed",
      title: "Repair completed", body: `${iss.title} · ${r.providerName} · ${r.afterPhoto && r.afterVideo ? "after photo and clip" : r.afterVideo ? "after clip" : "after photo"} from the same angle, taken by ${ins.name}`,
      href: iss.reportId ? `/app/reports/${iss.reportId}#${iss.id}` : `/app/visits/${iss.visitId}#live`,
    });
  });
  revalidatePath("/field", "layout");
  revalidatePath("/app", "layout");
  return { ok: true };
}

/* ── shared ──────────────────────────────────────────────────── */


/* ── the inspector's own details ─────────────────────────────── */

/** name@bank — what every UPI app shows as "UPI ID". */
const UPI = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.]{1,63}$/;

/** Name and UPI ID. Asked for before the first job, because the day's
    pay goes to that UPI the same evening. */
export async function saveInspectorProfile(_prev: FieldState, fd: FormData): Promise<FieldState> {
  const user = await requireInspector();
  const name = str(fd, "name", 60);
  const upiId = str(fd, "upiId", 120).replace(/\s+/g, "").toLowerCase();
  if (name.length < 2) return { ok: false, error: "Your name, as owners will see it." };
  if (!UPI.test(upiId)) return { ok: false, error: "That does not look like a UPI ID — it is written like name@okbank." };
  const ok = await mutate((d) => {
    const ins = d.inspectors.find((i) => i.userId === user.id);
    if (!ins) return false;
    ins.name = name;
    ins.initials = initialsOf(name);
    ins.upiId = upiId;
    const u = d.users.find((x) => x.id === user.id);
    if (u && !u.name) u.name = name;
    return true;
  });
  if (!ok) return { ok: false, error: "Your inspector profile is not set up yet." };
  revalidatePath("/field", "layout");
  return { ok: true };
}
