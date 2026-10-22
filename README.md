# alvaro2b

A private web app (PWA) for a group of friends who meet to play board games: browse the game catalog, vote on what to play before a session, log each play, keep group photos, and review history and stats.

Live at https://alvaro2b.vercel.app (Members only).

## Tech stack

- [Next.js](https://nextjs.org/) (TypeScript), deployed on [Vercel](https://vercel.com/)
- [Supabase](https://supabase.com/): Postgres, Auth (Google sign-in) and Storage
- Optional [BoardGameGeek](https://boardgamegeek.com/) XML API integration, enabled by `BGG_TOKEN`

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 24+ and [pnpm](https://pnpm.io/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), required by the local Supabase stack

The Supabase CLI is a dev dependency: run it with `pnpm supabase`.

### Run locally

```bash
git clone https://github.com/panicoenlaxbox/alvaro2b.git
cd alvaro2b
pnpm local    # http://localhost:3000
```

`pnpm local` is safe to run again at any time: it checks Docker, installs dependencies if needed, starts the local Supabase stack, writes `.env.local` if it does not exist and runs `pnpm dev`. Stop the stack with `pnpm supabase stop`.

Local data is fictional (`supabase/seed/`). Open http://localhost:3000/dev-login to sign in as one of the fictional Members; this route only exists in development against a local Supabase.

### Useful scripts

- `pnpm test`: domain logic tests (Vitest)
- `pnpm test:db`: database tests (pgTAP) against the local stack, with the sample data loaded
- `pnpm typecheck` and `pnpm lint`
- `pnpm db:reset` (or `--seed`): recreate the local database with the Members and sample data; `--empty` loads only the Members
- `pnpm db:catalog`: load the initial Catalog (`supabase/seed/catalog.sql`) into the local database
- `pnpm db:types`: regenerate `src/lib/supabase/database.types.ts` from the local database
- `pnpm bootstrap-admin`: add the first Admin (`ADMIN_EMAIL`) to the allowlist of the database at `SUPABASE_DB_URL`

## Deployment

- **App**: Vercel deploys only `main` to https://alvaro2b.vercel.app (region `dub1`, next to Supabase in `eu-west-1`). There are no previews or staging. Production variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `CRON_SECRET` and, optionally, `BGG_TOKEN`. Redeploy after adding a variable.
- **Database**: Supabase project `alvaro2b`. Migrations in `supabase/migrations/` are applied with `pnpm supabase db push`.
- **Keep-alive**: a daily Vercel cron calls `/api/keep-alive` so the free Supabase project is not paused.

## License

[MIT](LICENSE)
