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

### Run locally

```bash
git clone https://github.com/panicoenlaxbox/alvaro2b.git
cd alvaro2b
pnpm install
pnpm supabase start
```

Then copy `.env.example` to `.env.local` and fill it in with two values that `pnpm supabase start` prints (or `pnpm supabase status`, at any time):

- `NEXT_PUBLIC_SUPABASE_URL`: **Project URL**, in the **APIs** box (`http://127.0.0.1:54321`).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: **Publishable**, in the **Authentication Keys** box (`sb_publishable_…`). Finally:

```bash
pnpm dev
```

Supabase Studio, to browse the local database, is at http://localhost:54323.

> Stop the stack with `pnpm supabase stop` before quitting Docker: its containers restart with Docker unless they were stopped.

## Our games

Curious about what we play? Brace yourself for some envy: the group's collection, 34 Games and 5 Expansions, lives in [`supabase/seed/catalog.sql`](supabase/seed/catalog.sql).

## Deployment

- **App**: Vercel deploys only `main` to https://alvaro2b.vercel.app (region `dub1`, next to Supabase in `eu-west-1`). There are no previews or staging. Production variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `CRON_SECRET`.
- **Database**: Supabase project `alvaro2b`.
- **First Admin**: Members sign in only if their email is on the allowlist, managed by the Admin from the app. To add the very first Admin to an empty database, run `insert into public.allowed_emails (email, is_admin) values ('you@example.com', true);` in the SQL Editor.
- **Keep-alive**: the free Supabase plan pauses the whole project after a week without database activity, and it stays down until someone restores it by hand. So a daily Vercel cron (`vercel.json`) calls `/api/keep-alive`, which runs a real query. It is a Vercel cron and not a scheduled GitHub Actions workflow because GitHub disables scheduled workflows after 60 days without repository activity, exactly when the keep-alive matters most. If Supabase emails a pause warning, the keep-alive is not working.

## License

[MIT](LICENSE)
