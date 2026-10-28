import { gzipSync } from "node:zlib";
import { NextRequest, NextResponse } from "next/server";
import { db as postgres } from "@/lib/db";
import { putObject } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* ════════════════════════════════════════════════════════════════
   The nightly backup.

   Vercel calls this once a day (vercel.json → crons) with
   `Authorization: Bearer $CRON_SECRET`. Everything we keep in Postgres
   — the app's records and both lead tables — goes to the bucket as
   one gzipped JSON file per day, backups/YYYY-MM-DD.json.gz. The free
   database plan keeps no backups of its own, and a daily query also
   keeps it from pausing for want of activity.

   To restore: unzip the day's file; `records` rows go back into
   app.records as they are, `meta` into app.meta, and the lead rows
   into their tables.
   ════════════════════════════════════════════════════════════════ */

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const sql = postgres();
  if (!sql) return NextResponse.json({ error: "DATABASE_URL is not set." }, { status: 503 });

  const has = async (table: string) =>
    (await sql<{ ok: boolean }[]>`select to_regclass(${table}) is not null as ok`)[0].ok;
  const all = async (table: string) => ((await has(table)) ? sql.unsafe(`select * from ${table}`) : []);

  const dump = {
    takenAt: new Date().toISOString(),
    meta: await all("app.meta"),
    records: await all("app.records"),
    owner_leads: await all("public.owner_leads"),
    inspector_applications: await all("public.inspector_applications"),
  };
  const body = gzipSync(JSON.stringify(dump));
  const day = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
  await putObject(`backups/${day}.json.gz`, body, "application/gzip");

  return NextResponse.json({
    ok: true, key: `backups/${day}.json.gz`, bytes: body.length,
    rows: { records: dump.records.length, owner_leads: dump.owner_leads.length, inspector_applications: dump.inspector_applications.length },
  });
}
