// Adds the first Admin to the allowlist. The email comes from ADMIN_EMAIL and is never stored in
// the repository. Run once per environment:
//
//   ADMIN_EMAIL=... SUPABASE_DB_URL=... node scripts/bootstrap-admin.mjs
//
// It is idempotent: running it again keeps (or restores) the Admin flag on that email.
import pg from "pg";

const email = process.env.ADMIN_EMAIL?.trim();
const connectionString = process.env.SUPABASE_DB_URL;

if (!email || !connectionString) {
  console.error("ADMIN_EMAIL and SUPABASE_DB_URL must be set.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: /127\.0\.0\.1|localhost/.test(connectionString) ? false : { rejectUnauthorized: false },
});

await client.connect();
try {
  const { rows } = await client.query(
    `insert into public.allowed_emails (email, is_admin)
     values ($1, true)
     on conflict (email) do update set is_admin = true
     returning (xmax = 0) as inserted`,
    [email],
  );
  console.log(rows[0].inserted ? "Admin added to the allowlist." : "Admin was already on the allowlist.");
} finally {
  await client.end();
}
