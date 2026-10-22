// Loads the group's initial Catalog (supabase/seed/catalog.sql) into the local database:
//   pnpm db:catalog
// Safe to run again. For production, paste the same file into the SQL editor of the Supabase project.
// SUPABASE_DB_PASSWORD (the production password) is removed, as in scripts/supabase-local.mjs.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import pg from "pg";

const env = { ...process.env };
delete env.SUPABASE_DB_PASSWORD;

const status = spawnSync("pnpm", ["exec", "supabase", "status", "-o", "env"], {
  env,
  shell: process.platform === "win32",
  stdio: ["ignore", "pipe", "inherit"],
});
if (status.status !== 0) process.exit(status.status ?? 1);
const connectionString = status.stdout.toString().match(/^DB_URL="?(.*?)"?$/m)?.[1];

const client = new pg.Client({ connectionString });
await client.connect();
await client.query(readFileSync("supabase/seed/catalog.sql", "utf8"));
const { rows } = await client.query(
  "select (select count(*) from public.games) as games, (select count(*) from public.expansions) as expansions",
);
await client.end();
console.log(`Loaded supabase/seed/catalog.sql. The local Catalog now has ${rows[0].games} Games and ${rows[0].expansions} Expansions.`);
