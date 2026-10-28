# Still Yours

The marketing site **and** the owner app for **Still Yours** — the remote
property monitoring and maintenance service (Project WEB-01).

Everything runs in one Next.js app. The public pages live under
`src/app/(marketing)`, the signed-in owner app under `src/app/app`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home — hero with animated floor-plan inspection, trust strip, story, how it works, interactive "what happens when something's wrong", comparison, health score, owner stories, trust & safety, CTA |
| `/how-it-works` | All six steps in depth + the room-by-room checklist |
| `/owners` | For NRIs, portfolio investors and vacation-home owners |
| `/network` | For inspectors & service providers — verification flow, their apps, expectations |
| `/platform` | Four roles, admin dashboard, tech stack, roadmap |
| `/access` | Early-access / application form (`?role=owner|inspector|provider`, `?address=`) |

## Turning the apps on

The owner and inspector apps are **off in production** and always on
locally. In production every link to them is unrendered and the routes
themselves 404, so nobody reaches a sign-in form before we are ready.

```bash
# when it is time to go live
vercel env add NEXT_PUBLIC_APPS_LIVE production   # value: 1
vercel --prod
```

That is the only switch — `src/lib/flags.ts`. `DATABASE_URL` must point
at the app's Postgres first: see "Where the data lives" below.

## The owner app

| Route | What it is |
| --- | --- |
| `/signin` | Two doors: owners continue with Google (then give a phone number); inspectors use their rostered mobile and an SMS code |
| `/welcome` | Three-step first run: who you are → your property → your first visit |
| `/app` | Home — portfolio health, whatever is waiting on your decision, a live visit in progress, your properties |
| `/app/properties` · `/app/properties/[id]` | Every property, its health, its visits, its checklist, its access notes |
| `/app/book` | Book a visit: property, service, plan or cleaning tier, add-ons, day and window, live price |
| `/app/visits` · `/app/visits/[id]` | Booked → assigned → on the way → on site → report, with reschedule and cancel |
| `/app/reports` · `/app/reports/[id]` | The full report: health score, chain of custody, room by room, and the approve/decline on every flagged issue |
| `/app/plan` | Visits left, renewal date, and exactly what the Care+ repair cover absorbs |
| `/app/billing` | Bills raised after a visit or an approved repair. Nothing before |
| `/app/account` · `/app/activity` · `/app/help` | Profile, the whole audit trail, and the questions owners actually ask |

### The demo account

On a laptop, use the development sign-in on the owner door with **priya@example.in** and you
land in an account that has been running a while: three properties, a delivered
report with a decision waiting, a visit happening right now, and a repair
already closed out. Any other email creates a fresh account and walks the
welcome flow, which starts by asking for a phone number.

## The inspector app

Same sign-in, different door: a number on a `role: "inspector"` row lands
on `/field` instead of `/app`. That row is what an admin creates when
somebody finishes verification — the application form itself only
confirms which documents exist, because originals are checked in person.

| Route | What it is |
| --- | --- |
| `/field` | Today — the one job they are holding, or the three nearest on the board |
| `/field/jobs` | Every unclaimed job **in their city**, sorted by nearest, soonest or pays-most |
| `/field/jobs/[id]` | The brief: access notes, key holder, owner's instructions, what the job pays and why — then Claim |
| `/field/visit/[id]` | Check-in gate → checklist → review → submit |
| `/field/earnings` | Per visit, this week, awaiting review, the rate card, the deposit |
| `/field/record` | Rating, documents with expiry dates, localities, availability |

### The rules the app enforces

Not in a disabled button — in `src/lib/fieldActions.ts`, on the server:

- **One live job at a time.** Claiming is refused while anything of theirs
  is still `assigned`/`en_route`/`on_site`/`submitted`.
- **City only.** A claim for a property outside their city is refused.
- **No OTP, no checklist.** Check-in needs the owner's four-digit code,
  a location inside 250 m (or a written reason), and a photo of the front
  door. The draft checklist does not exist until all of it passes.
- **A flag needs proof.** Anything not marked OK needs a photograph and a
  note, and every room needs its video slot filled, or submit is refused
  and names the first thing missing.
- **Probation is real.** An inspector who is not `active` has every report
  held — written, but invisible to the owner until a person reads it.

Checklists are generated from the rooms the owner registered, so nobody
can walk fewer rooms than were booked. Photos are shrunk to a 320px JPEG
in the browser and stored as thumbnails; production uploads the
full-resolution original to object storage and keeps only the pointer.

### Signing in as an inspector

| Number | Who | State |
| --- | --- | --- |
| `9000000001` | Ravi K. | Active, one job already claimed |
| `9000000002` | Meena S. | On probation — 3 of 5 reports reviewed |
| `9000000003` | Arun P. | Active, on site right now, mid-checklist |

Owners are `9000000000` (Priya, the main demo), `9000000011`, `9000000012`.

### Where the data lives

Everything goes through `db()` and `mutate()` in `src/lib/store.ts`, and
where it lands depends on `DATABASE_URL`:

- **Set** — Postgres (`src/lib/storePg.ts`): the schema `app` holds one row
  per record, made by the app on first use. Writes take a lock on
  `app.meta`, so instances never overwrite each other. Production must
  have it — a deployment without it refuses to serve the app rather than
  keep bookings in one instance's `/tmp`.
- **Not set** — one JSON file at `.data/store.json`, seeded with the demo
  on first run (`src/lib/seed.ts`). No Postgres, no Docker: `npm run dev`
  is the whole setup.

A Postgres store starts empty, even from a laptop; `DEMO_DATA=1` seeds the
demo into it on purpose. The lead tables are made with `npm run migrate`.

```bash
npm run reset     # clears the file store; restart the dev server and it re-seeds
npm run migrate   # runs migrations/*.sql against DATABASE_URL
# a Postgres store is reset in SQL:  truncate app.records; delete from app.meta;
```

Photos and clip posters go to the R2 bucket under `photos/`, and the record
keeps only `/api/media/photo/<uuid>.jpg`. Every night at 03:00 IST
`/api/cron/backup` writes the whole database to `backups/YYYY-MM-DD.json.gz`
in the same bucket — it needs `CRON_SECRET` set in Vercel.

### Sign-in codes

Codes go out by SMS through MSG91's OTP widget when `MSG91_WIDGET_ID` and
`MSG91_TOKEN_AUTH` are set — MSG91 makes and checks the code, and its default
template needs no DLT registration — or else through Fast2SMS's OTP route when
`FAST2SMS_API_KEY` is set. Indian mobiles only; a number from abroad is told
so. On a laptop no SMS is sent (the demo accounts use made-up numbers) and the
code is shown on the sign-in screen instead, unless `SMS_IN_DEV=1`. See
`smsRoute` in `src/lib/auth.ts`.

## Installing it on a phone

The app is a PWA: `src/app/manifest.ts`, a small service worker in
`public/sw.js`, maskable icons in `public/icons`, and an `/offline` card for
when the connection drops. Account → **Add to home screen** always shows the
steps for the phone you are holding.

```bash
npm run dev        # http://localhost:3000
npm run dev:lan    # also reachable at http://<your-mac-ip>:3000
npm run dev:https  # same, over HTTPS with a self-signed certificate
```

- **iPhone** — open the LAN address in Safari, Share → *Add to Home Screen*. It
  opens full screen. Safari does not run the service worker over plain HTTP, so
  the offline card only works on `localhost` or over HTTPS.
- **Android** — Chrome only offers a real install over HTTPS, so use
  `npm run dev:https` (accept the self-signed certificate warning) or a tunnel.
  Over plain HTTP you still get a home-screen shortcut.

The service worker never caches build output in development — it is registered
as `/sw.js?dev=1`, which turns asset caching off, otherwise every CSS edit would
be served from yesterday's cache.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Lucide.

Fonts: Fraunces (display serif) + Schibsted Grotesk (UI) + JetBrains Mono (data labels), loaded with `next/font`.

## Structure

```
src/app                 routes + globals.css (design tokens)
src/components/home     home-page sections
src/components/shared   AddressBar, PageHero, FeatureRow, SectionHead, product Mocks
src/components/site     Nav, Footer, StickyBar
src/components/ui       FloorPlan, HealthRing, EvidenceFrame, Reveal, Logo
```

## Swapping in real photos

`EvidenceFrame` renders a vector "photo" placeholder. Pass `src="/photos/your-file.jpg"` to any instance to use a real image — the annotation box, corner brackets and caption strip render on top of it unchanged.

## Lead capture

Both forms on `/access` POST to `/api/leads`, which writes to Postgres and
optionally emails you. Before this existed, both forms called `setDone(true)`
and threw the submission away.

### Setup

1. Create a Postgres database (Neon, Supabase and Vercel Postgres all work).
2. Run the schema once:
   ```bash
   psql "$DATABASE_URL" -f migrations/001_leads.sql
   ```
3. Set `DATABASE_URL` in Vercel → Settings → Environment Variables, for all
   environments. Copy `.env.example` to `.env.local` for local work.
4. Optional, to be emailed on every submission: set `LEADS_EMAIL_TO` and
   `LEADS_EMAIL_FROM`, then **either** `RESEND_API_KEY` **or** SMTP
   (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`). Resend takes priority
   if both are present. Gmail works as the SMTP option with an App Password —
   see `.env.example`. With neither configured, leads still save; you just are
   not notified.

### Reading the leads

```sql
select created_at, name, email, phone, address, service, estimate_inr
from owner_leads order by created_at desc;

select created_at, name, phone, city, localities, experience
from inspector_applications order by created_at desc;
```

### If the database is down

The route returns 503 and the form shows the real failure with an email
fallback — it never reports success it did not achieve. The full payload is
written to the Vercel logs so any lead lost to an outage can be recovered.
