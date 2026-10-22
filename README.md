# alvaro2b

A private web app (PWA) for a group of friends who meet to play board games: browse the game catalog, vote on what to play before a session, log each play, keep group photos, and review history and stats.

Live at https://alvaro2b.vercel.app (Members only).

## Tech stack

- [Next.js](https://nextjs.org/) (TypeScript), deployed on [Vercel](https://vercel.com/)
- [Supabase](https://supabase.com/): Postgres, Auth (Google sign-in) and Storage

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 24+ and [pnpm](https://pnpm.io/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), required by the local Supabase stack

The [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) is a dev dependency: run it with `pnpm supabase`.

### Run locally

```bash
git clone https://github.com/panicoenlaxbox/alvaro2b.git
cd alvaro2b
pnpm install
pnpm supabase start    # local Supabase in Docker: Postgres, Auth, Storage and Studio
```

`supabase start` applies the migrations in `supabase/migrations/` and loads the fictional seed data in `supabase/seed/`. Then copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with the API URL and the publishable key printed by `pnpm supabase status`. Finally:

```bash
pnpm dev    # http://localhost:3000
```

Open http://localhost:3000/dev-login to sign in as one of the fictional Members; this route only exists in development against a local Supabase. Supabase Studio, to browse the local database, is at http://localhost:54323. Stop the stack with `pnpm supabase stop`.

### Scripts

- `pnpm dev`, `pnpm build` and `pnpm start`
- `pnpm lint` and `pnpm typecheck`
- `pnpm test`: domain logic tests (Vitest), in watch mode

### Supabase CLI

- `pnpm supabase test db`: database tests (pgTAP) in `supabase/tests/`, against the seed data
- `pnpm supabase db reset`: recreate the local database from the migrations and reload the seed data
- `pnpm supabase migration new <name>`: create an empty migration in `supabase/migrations/`
- `pnpm supabase gen types typescript --local > src/lib/supabase/database.types.ts`: regenerate the database types after a schema change

## Our games

Curious about what we play? Brace yourself for some envy: the group's collection, 34 Games and 5 Expansions, lives in [`supabase/seed/catalog.sql`](supabase/seed/catalog.sql).

To load it, paste the whole file into the SQL Editor of Supabase Studio and run it: locally at http://localhost:54323, or in the `alvaro2b` project for production. Games and Expansions that already exist with the same name are left untouched, so it is safe to run again. Owners are added afterwards from the app.

## Deployment

- **App**: Vercel deploys only `main` to https://alvaro2b.vercel.app (region `dub1`, next to Supabase in `eu-west-1`). There are no previews or staging. Production variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `CRON_SECRET`. Redeploy after adding a variable.
- **Database**: Supabase project `alvaro2b`. Apply new migrations with `pnpm supabase db push -p <password>` (add `--dry-run` to see what would be applied first). Keep the production password out of `SUPABASE_DB_PASSWORD`: the CLI reads that variable for local commands too, and `gen types --local` fails with it.
- **First Admin**: Members sign in only if their email is on the allowlist, managed by the Admin from the app. To add the very first Admin to an empty database, run `insert into public.allowed_emails (email, is_admin) values ('you@example.com', true);` in the SQL Editor.
- **Keep-alive**: a daily Vercel cron calls `/api/keep-alive` so the free Supabase project is not paused.

## License

[MIT](LICENSE)
