# alvaro2b

A private web app (PWA) for a group of friends who meet to play board games: browse the game catalog, vote on what to play before a session, log each play (who played, who won, how long it took, notes), keep group photos, and review history and stats.

Live at https://alvaro2b.vercel.app (Members only). Product and domain docs are in Spanish: see [`docs/PRD.md`](docs/PRD.md), [`GLOSSARY.md`](GLOSSARY.md), [`docs/adr/`](docs/adr/) and the build log in [`docs/PLAN.md`](docs/PLAN.md).

## Tech stack

- [Next.js](https://nextjs.org/) (TypeScript), deployed on [Vercel](https://vercel.com/)
- [Supabase](https://supabase.com/): Postgres, Auth (Google sign-in) and Storage
- Optional [BoardGameGeek](https://boardgamegeek.com/) XML API integration

## Project layout

- `src/app/`: routes (App Router). Signed-in pages live in `src/app/(app)/`; `src/proxy.ts` sends signed-out visitors to `/login`.
- `src/lib/domain/`: pure domain logic (Ranking, Session lifecycle, Polls, Catalog exploration, statistics), with Vitest tests next to each file.
- `src/lib/data/`: server-side data loading through Supabase, always under the signed-in Member's Row Level Security.
- `src/lib/bgg/`: optional BoardGameGeek client; it turns on when `BGG_TOKEN` is set.
- `supabase/migrations/`: versioned schema with RLS and explicit grants. `supabase/tests/`: pgTAP tests of the access rules. `supabase/seed/`: fictional local data (`01_members.sql` with the Members, `02_sample.sql` with sample Games, Sessions, Plays and a Poll).
- `.github/workflows/`: CI (lint, types, tests, build, pgTAP) and the weekly encrypted backup.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 24+ and [pnpm](https://pnpm.io/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), required by the local Supabase stack
- The [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) is a dev dependency of the project: `pnpm install` installs it, and you run it with `pnpm supabase`.

### Run locally

```bash
git clone https://github.com/panicoenlaxbox/alvaro2b.git
cd alvaro2b
pnpm local    # http://localhost:3000
```

`pnpm local` (`scripts/local.mjs`) is safe to run again at any time: it checks that Docker is running, runs `pnpm install` if `node_modules` is missing, starts the local Supabase stack (Postgres, Auth and Storage in Docker) if it is stopped, writes `.env.local` from `pnpm supabase status` if it does not exist, and runs `pnpm dev`. It ignores `SUPABASE_DB_PASSWORD`, which belongs to production. To add optional variables such as `BGG_TOKEN`, edit `.env.local` using `.env.example` as reference. Stop the stack with `pnpm supabase stop`.

Local data is fictional seed data (`supabase/seed/`). Open http://localhost:3000/dev-login to sign in as one of the fictional Members; this route only exists in development against a local Supabase. Google sign-in works locally only if `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set when you run `pnpm supabase start`.

### Useful scripts

- `pnpm test`: domain logic tests (Vitest)
- `pnpm test:db`: database tests (pgTAP) against the local stack
- `pnpm typecheck` and `pnpm lint`
- `pnpm db:reset --seed` (or plain `pnpm db:reset`): recreate the local database from migrations with the Members and sample data
- `pnpm db:reset --empty`: same, but with only the Members, to try the app from an empty group
- `pnpm db:types`: regenerate `src/lib/supabase/database.types.ts` from the local database
- `pnpm bootstrap-admin`: add the first Admin (`ADMIN_EMAIL`) to the allowlist of the database at `SUPABASE_DB_URL`

## Deployment and environments

Owner-only setup (accounts, tokens, environments) is described in [`docs/SETUP.md`](docs/SETUP.md), and the owner's pending tasks are in [`docs/TASKS.md`](docs/TASKS.md) (both in Spanish).

## License

[MIT](LICENSE)
