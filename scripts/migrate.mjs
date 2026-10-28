/* Runs every migrations/*.sql against DATABASE_URL, in name order.
   Each file is written to be safe to run again ("if not exists").

     npm run migrate                      # DATABASE_URL from .env.local
     DATABASE_URL=… npm run migrate       # any other database

   The app's own tables (schema `app`) are made by the app on first use;
   these are the ones the lead forms write to. */

import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

if (!process.env.DATABASE_URL && fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (here or in .env.local).");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, connect_timeout: 10, onnotice: () => {} });
const dir = path.join(process.cwd(), "migrations");
try {
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await sql.unsafe(fs.readFileSync(path.join(dir, file), "utf8")).simple();
    console.log(`✓ ${file}`);
  }
  const [{ host }] = await sql`select inet_server_addr()::text as host`;
  console.log(`done · ${new URL(url).hostname.split(".").slice(-3).join(".")} (${host ?? "pooled"})`);
} catch (err) {
  console.error("✗", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
