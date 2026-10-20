# alvaro2b

A private web app (PWA) for a group of friends who meet to play board games: browse the game catalog, vote on what to play before a session, log each play (who played, who won, how long it took, notes), keep group photos, and review history and stats.

Product and domain docs are in Spanish: see [`docs/PRD.md`](docs/PRD.md), [`GLOSSARY.md`](GLOSSARY.md) and [`docs/adr/`](docs/adr/).

## Tech stack

- [Next.js](https://nextjs.org/) (TypeScript), deployed on [Vercel](https://vercel.com/)
- [Supabase](https://supabase.com/): Postgres, Auth (Google sign-in) and Storage
- Optional [BoardGameGeek](https://boardgamegeek.com/) XML API integration

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 24+ and [pnpm](https://pnpm.io/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), required by the local Supabase stack
- The [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) is a dev dependency of the project: `pnpm install` installs it, and you run it with `pnpm supabase`.

### Run locally

```bash
git clone https://github.com/panicoenlaxbox/alvaro2b.git
cd alvaro2b
pnpm install
pnpm supabase start           # starts local Postgres, Auth and Storage in Docker
cp .env.example .env.local    # fill in the values printed by `pnpm supabase status`
pnpm dev                      # http://localhost:3000
```

Local data is fictional seed data (`supabase/seed.sql`). Open http://localhost:3000/dev-login to sign in as one of the fictional Members; this route only exists in development against a local Supabase. Google sign-in works locally only if `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set when you run `pnpm supabase start`.

### Useful scripts

- `pnpm test`: domain logic tests (Vitest)
- `pnpm typecheck` and `pnpm lint`
- `pnpm supabase db reset`: recreate the local database from migrations and seed
- `pnpm db:types`: regenerate `src/lib/supabase/database.types.ts` from the local database
- `pnpm bootstrap-admin`: add the first Admin (`ADMIN_EMAIL`) to the allowlist of the database at `SUPABASE_DB_URL`

## Deployment and environments

Owner-only setup (accounts, tokens, environments) is described in [`docs/SETUP.md`](docs/SETUP.md) (Spanish).

## License

[MIT](LICENSE)
