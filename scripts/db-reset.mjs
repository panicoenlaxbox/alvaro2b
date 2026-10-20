// Recreates the local database from the migrations, then loads fictional data:
//   pnpm db:reset          same as --seed
//   pnpm db:reset --seed   Members plus sample data (every file in supabase/config.toml [db.seed])
//   pnpm db:reset --empty  only the Members in supabase/seed/01_members.sql, to sign in at /dev-login
// SUPABASE_DB_PASSWORD (the production password) is removed, as in scripts/supabase-local.mjs.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import pg from "pg";

const mode = process.argv[2] ?? "--seed";
if (!["--seed", "--empty"].includes(mode)) {
  console.error(`Unknown option ${mode}. Use --seed or --empty.`);
  process.exit(1);
}

const env = { ...process.env };
delete env.SUPABASE_DB_PASSWORD;

function supabase(args, stdio = "inherit") {
  const result = spawnSync("pnpm", ["exec", "supabase", ...args], { env, shell: process.platform === "win32", stdio });
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result;
}

if (mode === "--seed") {
  supabase(["db", "reset"]);
} else {
  supabase(["db", "reset", "--no-seed"]);
  const status = supabase(["status", "-o", "env"], ["ignore", "pipe", "inherit"]).stdout.toString();
  const connectionString = status.match(/^DB_URL="?(.*?)"?$/m)?.[1];
  const client = new pg.Client({ connectionString });
  await client.connect();
  await client.query(readFileSync("supabase/seed/01_members.sql", "utf8"));
  await client.end();
  console.log("Loaded only the Members (supabase/seed/01_members.sql).");
}
