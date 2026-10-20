// Regenerates src/lib/supabase/database.types.ts from the local Supabase database.
// SUPABASE_DB_PASSWORD (the production password) is removed from the environment because the CLI
// would otherwise try it against the local database.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const env = { ...process.env };
delete env.SUPABASE_DB_PASSWORD;

const types = execFileSync("pnpm", ["exec", "supabase", "gen", "types", "typescript", "--local"], {
  env,
  shell: process.platform === "win32",
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

writeFileSync("src/lib/supabase/database.types.ts", types);
console.log("Updated src/lib/supabase/database.types.ts");
