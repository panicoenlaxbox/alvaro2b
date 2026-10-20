// Runs a Supabase CLI command against the local stack. SUPABASE_DB_PASSWORD (the production
// password) is removed from the environment, because the CLI would otherwise use it locally.
import { spawnSync } from "node:child_process";

const env = { ...process.env };
delete env.SUPABASE_DB_PASSWORD;

const { status } = spawnSync("pnpm", ["exec", "supabase", ...process.argv.slice(2)], {
  env,
  shell: process.platform === "win32",
  stdio: "inherit",
});
process.exit(status ?? 1);
