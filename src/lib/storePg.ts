/* ════════════════════════════════════════════════════════════════
   The store, on Postgres.

   The app reads and writes one object — `DB` in lib/types — through
   db() and mutate() in lib/store. With DATABASE_URL set, that object
   lives here, in a schema of its own:

     app.meta     one row: the shape version, and a revision number
                  that every write moves on by one
     app.records  one row per record — (kind, key) → its JSON and its
                  place in the list it belongs to

   Reading. Each server instance keeps the last copy it saw, with its
   revision. A read asks Postgres for the revision only — one tiny
   query — and loads everything again only when somebody has written
   since.

   Writing. The meta row is locked for the length of the transaction,
   so writes from every instance happen one after another, each on the
   latest data. The callback works on a copy; only the records it
   changed are sent, and the copy becomes this instance's cache once
   Postgres has committed it. A callback that throws writes nothing —
   except Next's redirect() and notFound(), which are how a finished
   action leaves, not failures.
   ════════════════════════════════════════════════════════════════ */

import type postgres from "postgres";
import type { DB } from "@/lib/types";
import { STORE_VERSION } from "@/lib/storeVersion";

type Sql = postgres.Sql;
type Tx = postgres.TransactionSql;

export type PgInit = {
  /** what a database nobody has written to yet starts with */
  fresh: () => DB;
  /** brings an older shape up to STORE_VERSION, in place */
  migrate: (d: DB) => DB;
};

const KINDS = [
  "users", "properties", "subscriptions", "visits", "reports", "issues", "invoices",
  "events", "inspectors", "tickets", "sessions", "otps", "payments",
] as const satisfies readonly (keyof DB)[];
type Kind = (typeof KINDS)[number];

/** `seen` holds, for every record as last loaded or written, its place
    and its JSON — what a write compares against to find what changed. */
type Snap = { rev: number; data: DB; seen: Map<string, string> };

const g = globalThis as unknown as { _pgSnap?: Snap; _pgSchema?: Promise<void>; _pgTail?: Promise<unknown> };

/* One store job at a time per instance. The client holds one connection
   (lib/db), and two transactions asking for it at once wait on each
   other for good — so every read and write here queues behind the last.
   Across instances, the meta row's lock does the same job. */
function serial<T>(job: () => Promise<T>): Promise<T> {
  const run = (g._pgTail ?? Promise.resolve()).then(job, job);
  g._pgTail = run.catch(() => undefined);
  return run;
}

/* ── the schema, made on first use ───────────────────────────── */

const SCHEMA = [
  `create schema if not exists app`,
  `create table if not exists app.meta (
     id int primary key check (id = 1),
     version int not null,
     rev bigint not null,
     updated_at timestamptz not null default now())`,
  `create table if not exists app.records (
     kind text not null,
     key text not null,
     pos int not null,
     data jsonb not null,
     updated_at timestamptz not null default now(),
     primary key (kind, key))`,
  /* Ours alone: nothing reaches these through Supabase's public API,
     even if somebody switches that API on later. */
  `alter table app.meta enable row level security`,
  `alter table app.records enable row level security`,
];

function schema(sql: Sql) {
  const ready = async () => {
    const [r] = await sql<{ ok: boolean }[]>`
      select to_regclass('app.meta') is not null and to_regclass('app.records') is not null as ok`;
    return r.ok;
  };
  g._pgSchema ??= (async () => {
    if (await ready()) return;
    try {
      for (const q of SCHEMA) await sql.unsafe(q);
    } catch (err) {
      /* two instances starting at once: one of them made it */
      if (!(await ready())) throw err;
    }
  })().catch((err) => {
    g._pgSchema = undefined;
    throw err;
  });
  return g._pgSchema;
}

/* ── records ↔ rows ──────────────────────────────────────────── */

type Row = { kind: Kind; key: string; pos: number; json: string };

const keyOf = (kind: Kind, item: unknown, pos: number) => {
  const x = item as { id?: unknown; phone?: unknown; purpose?: unknown };
  if (typeof x.id === "string" && x.id) return x.id;
  if (kind === "otps") return `${x.purpose}:${x.phone}`;
  return `#${pos}`;
};
const slot = (kind: string, key: string) => `${kind}\u0000${key}`;
const mark = (pos: number, json: string) => `${pos}\u0000${json}`;

function rowsOf(d: DB): Row[] {
  const rows: Row[] = [];
  for (const kind of KINDS) {
    const used = new Set<string>();
    (d[kind] as unknown[]).forEach((item, pos) => {
      if (item === null || item === undefined) return;
      let key = keyOf(kind, item, pos);
      /* a duplicate keeps a row of its own rather than overwrite the first */
      if (used.has(key)) key = `${key}#${pos}`;
      used.add(key);
      rows.push({ kind, key, pos, json: JSON.stringify(item) });
    });
  }
  return rows;
}

async function loadAll(q: Sql | Tx, rev: number, version: number): Promise<Snap> {
  const rows = await q<{ kind: string; key: string; data: unknown }[]>`
    select kind, key, data from app.records order by kind, pos`;
  const data = { version } as DB;
  for (const k of KINDS) (data[k] as unknown[]) = [];
  const seen = new Map<string, string>();
  for (const r of rows) {
    if (!(KINDS as readonly string[]).includes(r.kind)) continue;
    const list = data[r.kind as Kind] as unknown[];
    seen.set(slot(r.kind, r.key), mark(list.length, JSON.stringify(r.data)));
    list.push(r.data);
  }
  return { rev, data, seen };
}

const UPSERT = `
  insert into app.records (kind, key, pos, data)
  select x.kind, x.key, x.pos, x.data
  from jsonb_to_recordset($1::text::jsonb) as x(kind text, key text, pos int, data jsonb)
  on conflict (kind, key) do update set pos = excluded.pos, data = excluded.data, updated_at = now()`;

const DELETE = `
  delete from app.records r
  using jsonb_to_recordset($1::text::jsonb) as x(kind text, key text)
  where r.kind = x.kind and r.key = x.key`;

/* Built by hand so each record's JSON, already made for the comparison,
   is not made a second time. It goes over as text ($1::text::jsonb):
   given a jsonb parameter, the driver would encode the string again. */
const payload = (rows: Row[]) =>
  `[${rows.map((r) => `{"kind":${JSON.stringify(r.kind)},"key":${JSON.stringify(r.key)},"pos":${r.pos},"data":${r.json}}`).join(",")}]`;

/** redirect() and notFound() are thrown, but they mean "done". */
const leaving = (e: unknown) => {
  const digest = (e as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && /^NEXT_(REDIRECT|HTTP_ERROR_FALLBACK)/.test(digest);
};

/* ── the two things lib/store needs ──────────────────────────── */

export const pgRead = (sql: Sql, init: PgInit) => serial(() => read(sql, init));
export const pgWrite = <T>(sql: Sql, init: PgInit, fn: (d: DB) => T) => serial(() => write(sql, init, fn));

async function read(sql: Sql, init: PgInit): Promise<DB> {
  await schema(sql);
  const [m] = await sql<{ rev: string; version: number }[]>`select rev, version from app.meta where id = 1`;
  /* never written, or an older shape: one write sets it right for everybody */
  if (!m || m.version < STORE_VERSION) {
    await write(sql, init, () => undefined);
    return g._pgSnap!.data;
  }
  const rev = Number(m.rev);
  if (g._pgSnap?.rev === rev) return g._pgSnap.data;

  const snap = await sql.begin("isolation level repeatable read read only", async (tx) => {
    const [now] = await tx<{ rev: string; version: number }[]>`select rev, version from app.meta where id = 1`;
    return loadAll(tx, Number(now.rev), now.version);
  });
  if (!g._pgSnap || snap.rev >= g._pgSnap.rev) g._pgSnap = snap;
  return snap.data;
}

async function write<T>(sql: Sql, init: PgInit, fn: (d: DB) => T): Promise<T> {
  await schema(sql);
  let next: Snap | null = null;
  let left: unknown = null;

  const out = await sql.begin(async (tx) => {
    let [m] = await tx<{ rev: string; version: number }[]>`select rev, version from app.meta where id = 1 for update`;
    if (!m) {
      await tx`insert into app.meta (id, version, rev) values (1, 0, 0) on conflict (id) do nothing`;
      [m] = await tx<{ rev: string; version: number }[]>`select rev, version from app.meta where id = 1 for update`;
    }
    const rev = Number(m.rev);
    const base: Snap =
      rev === 0 ? { rev: 0, data: init.fresh(), seen: new Map() }
      : g._pgSnap?.rev === rev ? g._pgSnap
      : await loadAll(tx, rev, m.version);

    const work = rev === 0 ? base.data : structuredClone(base.data);
    init.migrate(work);
    let result: T | undefined;
    try {
      result = fn(work);
    } catch (e) {
      if (!leaving(e)) throw e;
      left = e;
    }

    const seen = new Map<string, string>();
    const changed: Row[] = [];
    for (const r of rowsOf(work)) {
      const s = slot(r.kind, r.key), mk = mark(r.pos, r.json);
      seen.set(s, mk);
      if (base.seen.get(s) !== mk) changed.push(r);
    }
    const gone = [...base.seen.keys()]
      .filter((s) => !seen.has(s))
      .map((s) => {
        const [kind, key] = s.split("\u0000");
        return { kind, key };
      });

    if (!changed.length && !gone.length && work.version === m.version) {
      next = base;
      return result as T;
    }
    if (changed.length) await tx.unsafe(UPSERT, [payload(changed)]);
    if (gone.length) await tx.unsafe(DELETE, [JSON.stringify(gone)]);
    const [n] = await tx<{ rev: string }[]>`
      update app.meta set version = ${work.version}, rev = rev + 1, updated_at = now() where id = 1 returning rev`;
    next = { rev: Number(n.rev), data: work, seen };
    return result as T;
  });

  if (next) g._pgSnap = next;
  if (left) throw left;
  return out as T;
}
