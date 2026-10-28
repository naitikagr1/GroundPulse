/* ════════════════════════════════════════════════════════════════
   The store.

   Everything the app knows is one object (`DB` in lib/types), read
   with db() and changed with mutate(). Where it is kept depends on
   DATABASE_URL:

   · set — Postgres (lib/storePg). Production always; a laptop too,
     when you want to test against the real thing.
   · not set — one JSON file under `.data/`, read into memory once per
     server process and written back on every mutation, so the whole
     app runs with `npm run dev` and nothing else installed.

   Every function is async and every query is scoped by owner, so
   nothing above this file knows which one it is talking to.
   ════════════════════════════════════════════════════════════════ */

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { DB } from "@/lib/types";
import { demoData, emptyStore, opsUser, seed } from "@/lib/seed";
import { normaliseCity } from "@/lib/city";
import { planAllowance } from "@/lib/plans";
import { STORE_VERSION } from "@/lib/storeVersion";
import { db as postgres } from "@/lib/db";
import { pgRead, pgWrite, type PgInit } from "@/lib/storePg";

/* Locally this sits next to the code, where it is easy to inspect and
   easy to delete. On a serverless host the working directory is
   read-only, so a build there writes to /tmp — but a deployment never
   serves from this file: see noDatabase() below. */
const WRITABLE = process.env.VERCEL ? "/tmp" : process.cwd();
const DIR = path.join(WRITABLE, ".data");
const FILE = path.join(DIR, "store.json");

export { STORE_VERSION };

const globalForStore = globalThis as unknown as { _db?: DB };

function load(): DB {
  const cached = globalForStore._db;
  if (cached) {
    /* A dev server keeps its copy across code reloads — upgrade that too. */
    if ((cached.version ?? 1) < STORE_VERSION) {
      globalForStore._db = migrate(cached);
      flush();
    }
    return globalForStore._db!;
  }

  if (fs.existsSync(FILE)) {
    /* Only a missing file means "first run". Re-seeding because a read
       glitched would quietly delete somebody's properties, so a damaged
       file is left exactly where it is and the request fails loudly
       instead. */
    const raw = fs.readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw) as DB;
    const before = parsed.version ?? 1;
    globalForStore._db = migrate(parsed);
    if (before !== STORE_VERSION) flush();
    return globalForStore._db!;
  }

  /* A real deployment starts empty: the demo owners, their properties and
     the jobs on the inspectors' board are made up, and a real inspector
     must never be able to claim one. */
  globalForStore._db = migrate(demoData() ? seed() : emptyStore());
  flush();
  return globalForStore._db!;
}

/* ── upgrading an older store.json ───────────────────────────────
   Somebody's local data should survive a new release. Each step fills
   the fields that did not exist yet with what they would have been. */
type Loose = Record<string, unknown>;
function migrate(d: DB): DB {
  const version = d.version ?? 1;
  if (version >= STORE_VERSION) return d;

  if (version < 2) {
    const any = d as unknown as Loose;
    any.tickets ??= [];
    any.sessions ??= [];
    /* the old rows had a different shape and nothing reads them */
    any.otps = [];

    for (const u of d.users) {
      const x = u as unknown as Loose;
      x.tz ??= "Asia/Kolkata";
      x.prefs ??= { sms: true, email: true };
      x.deletedAt ??= null;
    }

    for (const p of d.properties) p.city = normaliseCity(p.city) || "Bengaluru";

    for (const s of d.subscriptions) {
      const x = s as unknown as Loose;
      const a = planAllowance(s.planId);
      x.cleansTotal ??= a.cleans;
      x.cleansUsed ??= 0;
      x.servicesTotal ??= a.services;
      x.servicesUsed ??= 0;
      x.autoRenew ??= true;
      x.startedByVisitId ??= null;
    }

    for (const v of d.visits) {
      const x = v as unknown as Loose;
      if (x.usesPlan === undefined) {
        const sub = d.subscriptions.find((s) => s.propertyId === v.propertyId && s.planId === v.planId);
        const onPlan = !!sub && v.kind === "inspection" && (v.planId === "care" || v.planId === "care-plus");
        x.usesPlan = onPlan;
        x.subscriptionId = onPlan ? sub!.id : null;
        /* The old counter only moved when a visit was submitted. The new one
           holds a place from the moment of booking, so the visits already
           booked and still to come take theirs now. */
        if (onPlan && !["submitted", "ready", "closed", "cancelled"].includes(v.status)) sub!.visitsUsed += 1;
      }
      x.subscriptionId ??= null;
      x.planClean ??= false;
      x.planService ??= "";
      x.lines ??= [];
      x.rating ??= null;
      x.cancelledAt ??= null;
    }

    for (const r of d.reports) {
      const x = r as unknown as Loose;
      x.doorPhoto ??= null;
      x.reviewedAt ??= null;
      x.shareToken ??= null;
    }

    for (const i of d.issues) {
      const x = i as unknown as Loose;
      x.photos ??= [];
      x.quotedAt ??= i.quote ? i.decidedAt ?? null : null;
      x.coverEligible ??= true;
      if (i.repair) {
        const r = i.repair as unknown as Loose;
        r.slot ??= "";
        r.afterPhoto ??= null;
      }
    }

    for (const inv of d.invoices) {
      const x = inv as unknown as Loose;
      const iss = d.issues.find((i) => inv.title.includes(i.ref));
      x.issueId ??= iss?.id ?? null;
      x.subscriptionId ??= null;
    }
  }

  if (version < 3) {
    /* The demo's ops console needs somebody who can sign in to it. A real
       deployment gets its ops seat from the roster instead. */
    if (demoData() && !d.users.some((u) => u.role === "admin")) d.users.push(opsUser());
  }

  if (version < 4) {
    for (const v of d.visits) {
      const x = v as unknown as Loose;
      x.otpTries ??= 0;
      if (v.checkIn) (v.checkIn as unknown as Loose).note ??= "";
    }
  }

  if (version < 5) {
    /* Nobody had marked an exact spot yet. The old check-in distance was
       measured from the middle of the locality, not from anything the
       owner marked — so it is dropped rather than shown as if it were. */
    for (const p of d.properties) (p as unknown as Loose).pin ??= null;
    for (const v of d.visits) {
      if (!v.checkIn) continue;
      const x = v.checkIn as unknown as Loose;
      x.accuracyM ??= null;
      x.distanceM = -1;
    }
  }

  if (version < 6) {
    /* The room "video slot" used to be a tick with no film behind it. It
       becomes a real clip, so an old tick counts for nothing — the room
       has to be filmed. Items and issues start with no clips. */
    for (const v of d.visits) {
      for (const r of v.draft ?? []) {
        (r as unknown as Loose).video = null;
        for (const i of r.items) (i as unknown as Loose).videos ??= [];
      }
    }
    for (const i of d.issues) {
      (i as unknown as Loose).videos ??= [];
      if (i.repair) (i.repair as unknown as Loose).afterVideo ??= null;
    }
  }

  if (version < 7) {
    /* A store written at 6 before that step learned about clips has
       none of those fields. Fill them only — the step above also voids
       draft room videos, and those may now be real. */
    for (const v of d.visits) {
      for (const r of v.draft ?? []) for (const i of r.items) (i as unknown as Loose).videos ??= [];
    }
    for (const i of d.issues) {
      (i as unknown as Loose).videos ??= [];
      if (i.repair) (i.repair as unknown as Loose).afterVideo ??= null;
    }
  }

  if (version < 8) {
    /* Money up front and the inspectors' own UPI. Nothing old was paid
       in advance, so nothing old owes an advance. */
    (d as unknown as Loose).payments ??= [];
    for (const v of d.visits) {
      (v as unknown as Loose).advanceInr ??= 0;
      (v as unknown as Loose).overtimeInr ??= 0;
    }
    for (const i of d.inspectors) (i as unknown as Loose).upiId ??= "";
  }

  if (version < 9) {
    /* Ops now records each inspector payout as it is sent. Everything
       finished before today was paid on its day — the earnings page has
       said so all along — so only today's work starts out owed. */
    const today = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
    for (const v of d.visits) {
      if (["submitted", "ready", "closed"].includes(v.status) && v.scheduledFor < today) v.payoutSentAt ??= v.endedAt ?? v.createdAt;
    }
  }

  if (version < 10) {
    /* A second code, to close a visit, for every visit not yet finished. */
    for (const v of d.visits) {
      if (!v.exitCode && ["unpaid", "scheduled", "assigned", "en_route", "on_site"].includes(v.status)) {
        v.exitCode = String(1000 + Math.floor(Math.random() * 9000));
      }
    }
    for (const i of d.inspectors) (i as unknown as Loose).penalties ??= [];
  }

  d.version = STORE_VERSION;
  return d;
}

function flush() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(globalForStore._db, null, 2));
  } catch (err) {
    // A failed write must not take the request down with it — the in-memory
    // copy is still correct for the life of this process.
    console.error("[store] could not persist", err);
  }
}

/* An empty database starts empty — even from a laptop, which would
   otherwise seed the made-up demo owners into whatever database
   DATABASE_URL points at. DEMO_DATA=1 asks for them on purpose. */
const PG: PgInit = { fresh: () => (process.env.DEMO_DATA === "1" ? seed() : emptyStore()), migrate };

/* A deployment without a database would keep its data in one
   instance's /tmp — different on every instance and gone at the next
   deploy. Bookings and payments must never live there, so it refuses. */
function noDatabase() {
  if (process.env.VERCEL) throw new Error("DATABASE_URL is not set: the app has nowhere to keep its data.");
}

/** Read-only view. Never mutate what comes back from here. */
export async function db(): Promise<DB> {
  const sql = postgres();
  if (sql) return pgRead(sql, PG);
  noDatabase();
  return load();
}

/** Mutate and persist in one step, so no caller can forget the write. */
export async function mutate<T>(fn: (d: DB) => T): Promise<T> {
  const sql = postgres();
  if (sql) return pgWrite(sql, PG, fn);
  noDatabase();
  const d = load();
  const out = fn(d);
  flush();
  return out;
}

export const uid = () => randomUUID();
export const now = () => new Date().toISOString();

/** Wipes the file store so the next read re-seeds it. (`npm run reset`
    does the same from the shell; a Postgres store is reset in SQL —
    `truncate app.records; delete from app.meta;`.) */
export function resetStore() {
  globalForStore._db = undefined;
  try { fs.rmSync(FILE, { force: true }); } catch { /* already gone */ }
}

/* ── references people can read out over the phone ─────────────
   Always one past the highest we have issued, so a new bill never
   lands on a number an older one already used. */
const pad = (n: number) => String(n).padStart(4, "0");
const nextNumber = (refs: string[], floor: number) =>
  Math.max(floor, ...refs.map((r) => Number(r.split("-").pop()) || 0)) + 1;

export const visitRef = (d: DB) => `VIS-${new Date().getFullYear()}-${pad(nextNumber(d.visits.map((x) => x.ref), 411))}`;
export const reportRef = (d: DB) => `RPT-${new Date().getFullYear()}-${pad(nextNumber(d.reports.map((x) => x.ref), 411))}`;
export const issueRef = (d: DB) => `ISS-${pad(nextNumber(d.issues.map((x) => x.ref), 916))}`;
export const invoiceRef = (d: DB) => `INV-${new Date().getFullYear()}-${pad(nextNumber(d.invoices.map((x) => x.ref), 27))}`;
export const ticketRef = (d: DB) => `TCK-${pad(nextNumber(d.tickets.map((x) => x.ref), 100))}`;
